// Tiny stack VM for make.fun tiny-stack-vm-01 (entry2, built in this session).
// Faithful to the kit ISA (generator/subject/ISA.md); vm.mjs is the rule.
// Per-step order: step-limit 10, pc-range 9, bad-opcode 5, immediate-fit 9,
// underflow 2 / overflow 3, then the op's own trap (4,6,7,8,11). A trap keeps
// prior output and its code is the exit code. MUL is Math.imul (exact low 32
// bits), DIV/MOD handle INT_MIN/-1, DIVU/MODU/LTU are unsigned, shifts mask
// the count with &31, PUSH8 sign-extends, EXIT keeps the low byte.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
// Per-opcode tables indexed by byte: IMM = immediate length (-1 unknown),
// EFF = pops*4+pushes (stack effect checked before the op runs).
const IMM = new Int8Array(256).fill(-1), EFF = new Uint8Array(256);
for (const [op, imm, pops, pushes] of [
  [0, 0, 0, 0], [1, 1, 0, 1], [2, 4, 0, 1], [3, 0, 1, 0], [4, 0, 1, 2],
  [5, 0, 2, 2], [6, 0, 2, 3], [7, 0, 3, 3], [23, 0, 1, 1], [27, 0, 1, 1],
  [48, 2, 0, 0], [49, 2, 1, 0], [50, 2, 1, 0], [51, 2, 0, 0], [52, 0, 0, 0],
  [64, 0, 1, 1], [65, 0, 2, 0], [80, 0, 1, 0], [81, 0, 1, 0], [82, 0, 0, 1],
  [83, 0, 1, 0],
] as const) { IMM[op] = imm; EFF[op] = pops * 4 + pushes; }
for (const op of [16, 17, 18, 19, 20, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34]) { IMM[op] = 0; EFF[op] = 9; }

for (const id of readdirSync(I).sort()) {
  const p = readFileSync(join(I, id, 'program.bin'));
  const q = readFileSync(join(I, id, 'input.bin'));
  const n = p.length;
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256);
  const o = new Uint8Array(65536);
  let s = 0, c = 0, pc = 0, ip = 0, ol = 0, st = 0, ex = 0;
  run: for (;;) {
    if (st >= 1e6) { ex = 10; break; }
    if (pc < 0 || pc >= n) { ex = 9; break; }
    const op = p[pc], imm = IMM[op];
    if (imm < 0) { ex = 5; break; }
    if (imm > 0 && pc + imm >= n) { ex = 9; break; }
    st++;
    const eff = EFF[op];
    if (s < (eff >> 2)) { ex = 2; break; }
    if (s - (eff >> 2) + (eff & 3) > 256) { ex = 3; break; }
    const nx = pc + 1 + imm;
    switch (op) {
      case 0: break run; // HALT, exit 0
      case 1: D[s++] = (p[pc + 1] << 24) >> 24; pc = nx; break; // PUSH8
      case 2: D[s++] = p[pc + 1] | (p[pc + 2] << 8) | (p[pc + 3] << 16) | (p[pc + 4] << 24); pc = nx; break; // PUSH32
      case 3: s--; pc = nx; break; // POP
      case 4: D[s] = D[s - 1]; s++; pc = nx; break; // DUP
      case 5: { const t = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = t; pc = nx; break; } // SWAP
      case 6: D[s] = D[s - 2]; s++; pc = nx; break; // OVER
      case 7: { const a = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = a; pc = nx; break; } // ROT
      case 23: D[s - 1] = -D[s - 1] | 0; pc = nx; break; // NEG
      case 27: D[s - 1] = ~D[s - 1]; pc = nx; break; // NOT
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34: {
        const b = D[s - 1], a = D[s - 2];
        let r: number;
        if (op === 16) r = a + b | 0; // ADD
        else if (op === 17) r = a - b | 0; // SUB
        else if (op === 18) r = Math.imul(a, b); // MUL
        else if (op === 19) { if (!b) { ex = 4; break run; } r = a === -2147483648 && b === -1 ? a : (a / b) | 0; } // DIV
        else if (op === 20) { if (!b) { ex = 4; break run; } r = b === -1 ? 0 : a % b | 0; } // MOD
        else if (op === 21) { if (!b) { ex = 4; break run; } r = Math.floor((a >>> 0) / (b >>> 0)) | 0; } // DIVU
        else if (op === 22) { if (!b) { ex = 4; break run; } r = (a >>> 0) % (b >>> 0) | 0; } // MODU
        else if (op === 24) r = a & b; // AND
        else if (op === 25) r = a | b; // OR
        else if (op === 26) r = a ^ b; // XOR
        else if (op === 28) r = a << (b & 31); // SHL
        else if (op === 29) r = a >> (b & 31); // SHR
        else if (op === 30) r = a >>> (b & 31) | 0; // SHRU
        else if (op === 32) r = a === b ? 1 : 0; // EQ
        else if (op === 33) r = a < b ? 1 : 0; // LT
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0; // LTU
        D[s - 2] = r; s--; pc = nx; break;
      }
      case 48: pc = nx + (((p[pc + 1] | (p[pc + 2] << 8)) << 16) >> 16); break; // JMP
      case 49: case 50: { // JZ / JNZ
        const v = D[--s], rel = ((p[pc + 1] | (p[pc + 2] << 8)) << 16) >> 16;
        pc = nx; if ((op === 49) === (v === 0)) pc += rel; break;
      }
      case 51: // CALL
        if (c > 63) { ex = 7; break run; }
        C[c++] = nx; pc = p[pc + 1] | (p[pc + 2] << 8); break;
      case 52: if (!c) { ex = 8; break run; } pc = C[--c]; break; // RET
      case 64: { // LOAD
        const a = D[s - 1];
        if (a < 0 || a > 255) { ex = 6; break run; }
        D[s - 1] = M[a]; pc = nx; break;
      }
      case 65: { // STORE ( v addr -- )
        const a = D[s - 1];
        if (a < 0 || a > 255) { ex = 6; break run; }
        M[a] = D[s - 2]; s -= 2; pc = nx; break;
      }
      case 80: { // PRINT decimal; nothing written if it would pass 65536
        const t = String(D[s - 1]);
        if (ol + t.length > 65536) { ex = 11; break run; }
        s--; for (let i = 0; i < t.length; i++) o[ol++] = t.charCodeAt(i);
        pc = nx; break;
      }
      case 81: // PUTC
        if (ol > 65535) { ex = 11; break run; }
        o[ol++] = D[--s] & 255; pc = nx; break;
      case 82: D[s++] = ip < q.length ? q[ip++] : -1; pc = nx; break; // IN
      case 83: ex = D[--s] & 255; break run; // EXIT
      default: ex = 5; break run;
    }
  }
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), o.subarray(0, ol));
  writeFileSync(join(O, id, 'exit.txt'), ex + '\n');
}
