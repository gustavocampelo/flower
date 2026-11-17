import * as THREE from 'three';
import { butterflyPosition, butterflyState } from './butterflyBehavior';
import { smooth } from './timeline';
import { CONFIG } from './config';
function wingGeometry(upper:boolean,color:string) {
 const p:number[]=[],c:number[]=[],idx:number[]=[];const base=new THREE.Color(color),edge=new THREE.Color('#57436e'),gold=new THREE.Color('#f8d9ad');
 const n=22,m=10;
 for(let j=0;j<=m;j++)for(let i=0;i<=n;i++) {
  const a=i/n*Math.PI;const r=j/m;const span=Math.sin(a)**.75;
  const x=r*(.10+(upper?.46:.32)*span),y=r*((upper?.18:-.12)+(upper?.40:-.32)*Math.cos(a));
  p.push(x,y,.065*Math.sin(r*Math.PI)*span);
  const col=base.clone();if(r>.87)col.lerp(edge,.72);else if(r>.69&&Math.sin(a*8)>.40)col.lerp(gold,.85);else col.multiplyScalar(.64+.36*Math.sin(r*Math.PI*.85));
  if(Math.abs(Math.sin(a*5))<.12)col.multiplyScalar(.63);c.push(col.r,col.g,col.b);
 }
 for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function createButterflies(parent:THREE.Group,landings:THREE.Vector3[]) {
 const colors=['#c7a5ee','#88c5df','#ed9ebc','#e5bd74'];const bodyMat=new THREE.MeshStandardMaterial({color:'#bea7a1',roughness:.6});
 const bodyGeo=new THREE.CapsuleGeometry(.034,.29,4,6);const antennaGeos:THREE.BufferGeometry[]=[];
 const sparkGeometry=new THREE.IcosahedronGeometry(.018,0);const sparkMaterial=new THREE.MeshBasicMaterial({color:'#efd6b7'});const sparkTransform=new THREE.Object3D();
 const butterflies=colors.map((color,i)=>{
  const root=new THREE.Group();const wings:THREE.Group[]=[];const geos=[wingGeometry(true,color),wingGeometry(false,color)];const reveal={value:0};
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.7,emissive:'#2c182e',emissiveIntensity:.22});
  mat.onBeforeCompile=shader=>{shader.uniforms.uReveal=reveal;shader.vertexShader='varying float vWingX;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWingX=abs(position.x);');shader.fragmentShader='uniform float uReveal;varying float vWingX;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vWingX>uReveal*.58)discard;');};
  const outlines:THREE.InstancedMesh[]=[];
  for(const side of [-1,1]) {const pivot=new THREE.Group();for(const g of geos){const wing=new THREE.Mesh(g,mat);wing.scale.x=side;pivot.add(wing);}
   const outline=new THREE.InstancedMesh(sparkGeometry,sparkMaterial,24);outline.frustumCulled=false;
   for(let k=0;k<24;k++){const upper=k<12;const a=(k%12+.5)/12*Math.PI;const span=Math.sin(a)**.75;sparkTransform.position.set(side*(.10+(upper?.46:.32)*span),(upper?.18:-.12)+(upper?.40:-.32)*Math.cos(a),0);sparkTransform.updateMatrix();outline.setMatrixAt(k,sparkTransform.matrix);}pivot.add(outline);outlines.push(outline);
   root.add(pivot);wings.push(pivot);}
  root.add(new THREE.Mesh(bodyGeo,bodyMat));
  for(const side of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.012,.15,0),new THREE.Vector3(side*.055,.26,0),new THREE.Vector3(side*.10,.29,.02)]);const g=new THREE.TubeGeometry(curve,8,.011,4,false);antennaGeos.push(g);root.add(new THREE.Mesh(g,bodyMat));}
  parent.add(root);return {root,wings,geos,mat,reveal,outlines,landing:landings[(i*2)%landings.length].clone(),state:'surgindo'};
 });
 const next=new THREE.Vector3(),pos=new THREE.Vector3();
 return {butterflies,update(t:number,mobile:boolean,reduced:boolean){butterflies.forEach((b,i)=>{
  const onset=CONFIG.timeline.butterflyStart+i*CONFIG.timeline.butterflyStagger;const appear=smooth(onset,onset+CONFIG.timeline.butterflyReveal,t);b.root.visible=appear>0;b.root.scale.setScalar(.64);b.reveal.value=appear;b.outlines.forEach(outline=>{outline.visible=appear>0&&appear<.96;outline.count=Math.ceil(24*(1-appear));});
  const motionTime=reduced?23+i*.2:t;const perched=butterflyPosition(motionTime,i,b.landing,pos,mobile);butterflyPosition(motionTime+.06,i,b.landing,next,mobile);
  // Simplified exclusion spheres. The final landing corridor is deliberately exempt.
  for(let j=0;j<CONFIG.flowers.length;j++){if(j===i*2&&perched>.8)continue;const f=CONFIG.flowers[j];const dx=pos.x-f.p[0],dy=pos.y-f.p[1],dz=pos.z-f.p[2];const radius=f.r+.16;const distance=Math.sqrt(dx*dx+dy*dy+dz*dz);if(distance<radius){const push=radius/Math.max(.001,distance);pos.set(f.p[0]+dx*push,f.p[1]+dy*push,f.p[2]+dz*push);}}
  const height=Math.max(0,b.landing.y+.8);pos.x+=Math.sin(t*.65+b.landing.y*1.3)*.018*height*perched;pos.z+=Math.sin(t*.52+(i<3?i*.94:0))*.012*height*perched;
  b.root.position.copy(pos);b.state=butterflyState(motionTime,i);
  b.root.rotation.set(.12+Math.sin(t*.8+i)*.08,Math.sin(t*.4+i)*.24,Math.atan2(-(next.x-pos.x),Math.max(.025,next.y-pos.y))*.18*(1-perched));
  const speed=perched>.98?1.8:8.8+i*.65;const amplitude=perched>.98?.14:.72;const flap=reduced?.25:.27+Math.sin(t*speed*Math.PI*2+i)*amplitude;
  b.wings[0].rotation.y=-flap;b.wings[1].rotation.y=flap;
 });},dispose(){sparkGeometry.dispose();sparkMaterial.dispose();bodyMat.dispose();bodyGeo.dispose();antennaGeos.forEach(g=>g.dispose());butterflies.forEach(b=>{b.mat.dispose();b.geos.forEach(g=>g.dispose());});}};
}
