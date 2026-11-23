import{mkdirSync as A,readdirSync as B,readFileSync as F,writeFileSync as W}from'node:fs';
import{join as J}from'node:path';
let I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output',T=new Int8Array(256).fill(-1),E=new Uint8Array(256),Z=[0,0,0,0,1,1,0,1,2,4,0,1,3,0,1,0,4,0,1,2,5,0,2,2,6,0,2,3,7,0,3,3,23,0,1,1,27,0,1,1,48,2,0,0,49,2,1,0,50,2,1,0,51,2,0,0,52,0,0,0,64,0,1,1,65,0,2,0,80,0,1,0,81,0,1,0,82,0,0,1,83,0,1,0];
for(let i=0;i<Z.length;i+=4)T[Z[i]]=Z[i+1],E[Z[i]]=4*Z[i+2]+Z[i+3];
for(let a of[16,17,18,19,20,21,22,24,25,26,28,29,30,32,33,34])T[a]=0,E[a]=9;
for(let d of B(I).sort()){let p=F(J(I,d,'program.bin')),q=F(J(I,d,'input.bin')),n=p.length,D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536),s=0,c=0,g=0,u=0,l=0,t=0,e=0;
R:for(;;){if(t>999999){e=10;break}if(g<0||g>=n){e=9;break}let k=p[g],m=T[k];if(m<0){e=5;break}if(m>0&&g+m>=n){e=9;break}t++;let f=E[k];if(s<f>>2){e=2;break}if(s-(f>>2)+(f&3)>256){e=3;break}let x=g+1+m;
switch(k){case 0:break R;
case 1:D[s++]=(p[g+1]<<24)>>24;g=x;break;
case 2:D[s++]=p[g+1]|p[g+2]<<8|p[g+3]<<16|p[g+4]<<24;g=x;break;
case 3:s--;g=x;break;
case 4:D[s]=D[s-1];s++;g=x;break;
case 5:{let v=D[s-1];D[s-1]=D[s-2];D[s-2]=v;g=x;break}
case 6:D[s]=D[s-2];s++;g=x;break;
case 7:{let v=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=v;g=x;break}
case 23:D[s-1]=-D[s-1]|0;g=x;break;
case 27:D[s-1]=~D[s-1];g=x;break;
case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:{let b=D[s-1],a=D[s-2],r;
if(k==16)r=a+b|0;else if(k==17)r=a-b|0;else if(k==18)r=Math.imul(a,b);else if(k==19){if(!b){e=4;break R}r=a==-2147483648&&b==-1?a:(a/b)|0}else if(k==20){if(!b){e=4;break R}r=b==-1?0:a%b|0}else if(k==21){if(!b){e=4;break R}r=Math.floor((a>>>0)/(b>>>0))|0}else if(k==22){if(!b){e=4;break R}r=(a>>>0)%(b>>>0)|0}else if(k==24)r=a&b;else if(k==25)r=a|b;else if(k==26)r=a^b;else if(k==28)r=a<<(b&31);else if(k==29)r=a>>(b&31);else if(k==30)r=a>>>(b&31)|0;else if(k==32)r=a==b?1:0;else if(k==33)r=a<b?1:0;else r=(a>>>0)<(b>>>0)?1:0;
D[s-2]=r;s--;g=x;break}
case 48:g=x+(((p[g+1]|p[g+2]<<8)<<16)>>16);break;
case 49:case 50:{let v=D[--s],w=((p[g+1]|p[g+2]<<8)<<16)>>16;g=x;if((k==49)==(v==0))g+=w;break}
case 51:if(c>63){e=7;break R}C[c++]=x;g=p[g+1]|p[g+2]<<8;break;
case 52:if(!c){e=8;break R}g=C[--c];break;
case 64:{let a=D[s-1];if(a<0||a>255){e=6;break R}D[s-1]=M[a];g=x;break}
case 65:{let a=D[s-1];if(a<0||a>255){e=6;break R}M[a]=D[s-2];s-=2;g=x;break}
case 80:{let v=String(D[s-1]);if(l+v.length>65536){e=11;break R}s--;for(let i=0;i<v.length;i++)o[l++]=v.charCodeAt(i);g=x;break}
case 81:if(l>65535){e=11;break R}o[l++]=D[--s]&255;g=x;break;
case 82:D[s++]=u<q.length?q[u++]:-1;g=x;break;
case 83:e=D[--s]&255;break R}
}
A(J(O,d),{recursive:true});W(J(O,d,'stdout.bin'),o.subarray(0,l));W(J(O,d,'exit.txt'),e+'\n');}
