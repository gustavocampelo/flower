import * as THREE from 'three';
import { CONFIG } from './config';
import { seededRandom } from '../utils/seededRandom';
import { BotanicalGeometry, botanicalMaterial } from './geometry';
import { createRose } from './createRose';
import { createLeaf } from './createFoliage';
import { createRibbon } from './createRibbon';
export function createBouquet(time:{value:number}) {
 const root=new THREE.Group(); const b=new BotanicalGeometry(); const rand=seededRandom(CONFIG.seed); const landings:THREE.Vector3[]=[];
 CONFIG.flowers.forEach((f,i)=>{
  const end=new THREE.Vector3(...f.p); const bottom=new THREE.Vector3((rand()-.5)*.33,-2.30+rand()*.24,(rand()-.5)*.22);
  const tie=new THREE.Vector3((rand()-.5)*.17,-.85,(rand()-.5)*.13);
  const curve=new THREE.CatmullRomCurve3([bottom,tie,new THREE.Vector3(end.x*.65,.52,end.z*.65-.09),end]);
  b.tube(curve,.026+(i%3)*.003,CONFIG.palette.stem,CONFIG.timeline.stemStart+i*.08,CONFIG.timeline.stemDuration,i);
  for(let n=0;n<3;n++) {const base=curve.getPoint(.38+n*.155); const side=(n+i)%2?1:-1; const tip=base.clone().add(new THREE.Vector3(side*(.58+rand()*.30),.40+rand()*.32,(rand()-.2)*.65)); createLeaf(b,base,tip,.15+rand()*.08,CONFIG.timeline.leafStart+n*.55+i*.07,i+n); }
  createRose(b,f.p,f.tilt,f.r,f.c,f.start,i*.47);
  landings.push(end.clone().add(new THREE.Vector3(.12,.18,.40)));
 });
 createRibbon(b); const geometry=b.build();
 const omitted=new Set<number>();for(const [start,end] of b.secondaryRanges)for(let i=start;i<end;i++)omitted.add(i);
 const lowGeometry=new THREE.BufferGeometry();for(const name of Object.keys(geometry.attributes))lowGeometry.setAttribute(name,geometry.getAttribute(name));lowGeometry.setIndex(b.indices.filter((_,i)=>!omitted.has(i)));
 const material=botanicalMaterial(time); const mesh=new THREE.Mesh(geometry,material); mesh.frustumCulled=false; root.add(mesh);
 return {root,landings,geometry,lowGeometry,mesh,material};
}
