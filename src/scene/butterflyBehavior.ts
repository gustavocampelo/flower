import * as THREE from 'three';
import { smooth } from './timeline.ts';
import { CONFIG } from './config.ts';
export type ButterflyState='surgindo'|'voando'|'aproximando'|'pousando'|'pousada'|'decolando';
export function butterflyState(t:number,index:number):ButterflyState {
 if(t<CONFIG.timeline.butterflyStart+CONFIG.timeline.butterflyReveal+index*CONFIG.timeline.butterflyStagger)return 'surgindo';
 const phase=((t-12+index*5)%28+28)%28;
 if(phase<15)return 'voando';if(phase<18)return 'aproximando';if(phase<19)return 'pousando';if(phase<23)return 'pousada';return 'decolando';
}
const flight=new THREE.Vector3();
/** Absolute-time trajectories: no simulation history, allocations or replay state. */
export function butterflyPosition(t:number,index:number,landing:THREE.Vector3,out:THREE.Vector3,mobile:boolean) {
 const s=t*.24+index*1.81;const phase=((t-12+index*5)%28+28)%28;
 const side=index%2?1:-1; const radius=mobile?1.70:2.38;
 // The free flight stays outside the botanical crown; landing corridors approach from +Z.
 flight.set(side*(radius+(mobile?.13:.24)*Math.sin(s*1.3)),1.45+.99*Math.sin(s*.92+index),(mobile?1.30:.8)+(mobile?.45:1.0)*Math.sin(s*.8+index));
 let approach=0;if(phase>=15&&phase<19)approach=smooth(15,19,phase);else if(phase>=19&&phase<23)approach=1;else if(phase>=23)approach=1-smooth(23,28,phase);
 out.copy(flight).lerp(landing,approach);out.z+=Math.sin(approach*Math.PI)*1.05;out.y+=Math.sin(approach*Math.PI)*.34;
 return approach;
}
