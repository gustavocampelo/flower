import { BotanicalGeometry, transform } from './geometry';
import * as THREE from 'three';
export function createRose(b: BotanicalGeometry, p: readonly number[], tilt: readonly number[], radius:number, color:string, start:number, phase:number) {
  const matrix=transform(p,tilt,radius);
  for(let layer=0;layer<5;layer++) {
    const count=layer===0?3:5+layer; const r=.18+layer*.205;
    for(let k=0;k<count;k++) {
      const angle=k/count*Math.PI*2+layer*2.399+phase; const width=(Math.PI*2/count)*.61;
      const petalOrigin=new THREE.Vector3(Math.cos(angle)*r*.25,Math.sin(angle)*r*.25,.03);
      b.surface((u,v)=>{
        const theta=angle+(u-.5)*width*2*(.55+.45*Math.sin(v*Math.PI*.5));
        const scallop=1-.24*Math.pow(2*u-1,2)+.045*Math.sin(u*Math.PI*3+phase+k);
        const rr=r*(.30+.70*v)*scallop;
        const z=-.25 + (.86-layer*.09)*Math.sin(v*Math.PI*.65) - .17*Math.pow(v,5) + .16*Math.pow(2*u-1,2)*v + .10*(u-.5)*v + .045*Math.sin(u*6+phase+k)*v;
        return {x:Math.cos(theta)*rr,y:Math.sin(theta)*rr,z,shade:.12+.68*Math.pow(v,.85)+.65*Math.pow(v,12)+.08*Math.sin(u*Math.PI)};
      },12,9,color,matrix,start+layer*.24+k*.018,.32,petalOrigin,phase);
    }
  }
}
