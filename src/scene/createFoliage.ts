import * as THREE from 'three';
import { BotanicalGeometry, transform } from './geometry';
export function createLeaf(b:BotanicalGeometry,base:THREE.Vector3,tip:THREE.Vector3,width:number,start:number,phase:number) {
 const dir=tip.clone().sub(base); const side=new THREE.Vector3(-dir.y,dir.x,.15).normalize();
 b.surface((u,v)=>{const w=Math.sin(Math.PI*v)**.85*width*(u*2-1); const ridge=.15*Math.sin(Math.PI*v)*(1-Math.abs(u*2-1)); return{x:base.x+dir.x*v+side.x*w,y:base.y+dir.y*v+side.y*w,z:base.z+dir.z*v+side.z*w+ridge+.13*Math.sin(v*Math.PI),shade:.57+.32*(1-Math.abs(u*2-1))+.20*u};},8,16,phase%2<1?'#4f926c':'#34765c',transform([0,0,0]),start,.65,base,phase);
 const mid=new THREE.CatmullRomCurve3([base,base.clone().lerp(tip,.5).add(new THREE.Vector3(0,0,.27)),tip]); b.tube(mid,.009,'#9aaa72',start,.65,phase);
}
