import * as THREE from 'three';
import { BotanicalGeometry, transform } from './geometry';
import { CONFIG } from './config';
export function createRibbon(b:BotanicalGeometry) {
 const m=transform([0,-.9,.28],[.12,.02,-.09]);
 for(const side of [-1,1]) {
  b.surface((u,v)=>{const a=v*Math.PI*2; const x=side*(.10+.71*Math.sin(a/2)); const y=.23*Math.sin(a); const z=.12+.20*Math.sin(a); const w=(u-.5)*.19; return{x:x+side*w*.25,y:y+w,z:z+w*Math.sin(a),shade:.74+.26*u};},6,40,CONFIG.palette.ribbon,m,7.3,.95,new THREE.Vector3());
  b.surface((u,v)=>{const w=(u-.5)*.20*(1+.32*v);return{x:side*(.08+.35*v+.10*Math.sin(v*5))+w,y:-v*.92+.07*Math.sin(v*5)+(v>.9?Math.abs(u-.5)*.15:0),z:.16+.14*Math.sin(v*6)+w*.4,shade:.65+.35*u};},7,24,'#777b85',m,8.1,.8);
 }
 b.surface((u,v)=>{const a=u*Math.PI*2; return{x:.14*Math.cos(a),y:(v-.5)*.22,z:.15+.09*Math.sin(a),shade:.7+.3*v};},14,6,'#b3b5bd',m,CONFIG.timeline.ribbonStart,.3);
}
