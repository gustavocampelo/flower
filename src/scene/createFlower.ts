import { BotanicalGeometry, transform } from './geometry';
import * as THREE from 'three';
export function createFlower(b:BotanicalGeometry,p:readonly number[],tilt:readonly number[],r:number,color:string,start:number,small=false) {
 const m=transform(p,tilt,r); const count=small?5:12;
 for(let k=0;k<count;k++) {const a=k/count*Math.PI*2;
  b.surface((u,v)=>{const rr=.16+v*.84; const w=Math.sin(Math.PI*v)*(.24+(small?.08:0))*(u*2-1); return {x:Math.cos(a)*rr-Math.sin(a)*w,y:Math.sin(a)*rr+Math.cos(a)*w,z:.12*Math.sin(v*Math.PI)-.16*v*v+.09*Math.pow(2*u-1,2)*Math.sin(v*Math.PI),shade:.72+.25*v-.09*Math.pow(2*u-1,2)};},6,10,color,m,start+k*.025,.6,new THREE.Vector3(0,0,0));
 }
 const seeds=small?9:65;
 for(let k=0;k<seeds;k++) {const a=k*2.39996, rr=.23*Math.sqrt(k/seeds); const cx=Math.cos(a)*rr,cy=Math.sin(a)*rr;
 const first=b.indices.length;
 b.surface((u,v)=>{const t=u*Math.PI*2,ph=v*Math.PI;return{x:cx+.037*Math.cos(t)*Math.sin(ph),y:cy+.037*Math.sin(t)*Math.sin(ph),z:.045+.055*Math.cos(ph)+.06*(1-rr/.23),shade:.65+.35*v};},5,4,k%3===0?'#ad6a27':'#f4c86b',m,start,.25);
 if(k%2===1)b.secondaryRanges.push([first,b.indices.length]);
 }
}
