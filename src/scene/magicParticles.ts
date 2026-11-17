import * as THREE from 'three';
import { CONFIG } from './config';
import { seededRandom } from '../utils/seededRandom';
import { smooth } from './timeline';
export function createMagicParticles(parent:THREE.Group) {
 const rand=seededRandom(CONFIG.seed+71);const seeds=Array.from({length:CONFIG.particles},()=>({a:rand()*Math.PI*2,r:2+rand()*2,y:rand()*5-2,phase:rand()*6.28,speed:.3+rand()*.7}));
 const geometry=new THREE.IcosahedronGeometry(1,0);const material=new THREE.MeshBasicMaterial({color:'white'});const mesh=new THREE.InstancedMesh(geometry,material,CONFIG.particles);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
 const colors=['#e9bb6f','#c88bb4','#a596da'];seeds.forEach((_,i)=>mesh.setColorAt(i,new THREE.Color(colors[i%3])));parent.add(mesh);const dummy=new THREE.Object3D();
 return {mesh,update(t:number,quality:number,reduced:boolean){
  const forming=1-smooth(CONFIG.timeline.magicFadeStart,CONFIG.timeline.magicFadeEnd,t);const count=reduced?6:Math.round(18+forming*(CONFIG.particles-18)*quality);mesh.count=count;
  for(let i=0;i<count;i++){const trail=i<18?0:(i-18)%3;const s=seeds[i<18?i:18+Math.floor((i-18)/3)];const sampleTime=t-trail*.065;const cycle=(sampleTime*s.speed+s.phase)%3/3;let x:number,y:number,z:number,size:number;
   if(i<18){const a=s.a+t*.20; x=Math.cos(a)*(1.1+s.r*.20);y=s.y+.22*Math.sin(t*.7+s.phase);z=Math.sin(a)*1.0;size=.012+.016*Math.pow(.5+.5*Math.sin(t*1.5+s.phase),4);}
   else if(Math.floor((i-18)/3)%3===0){const p=smooth(0,1,cycle);const a=s.a+sampleTime*.3;x=Math.cos(a)*s.r*(1-p);y=-1.9+3.8*p;z=Math.sin(a)*s.r*(1-p);size=.013+.016*Math.sin(p*Math.PI);}
   else {const a=s.a+sampleTime*.7;const progress=(cycle+sampleTime*.06)%1;x=Math.cos(a)*(.18+progress*.95);y=-2.1+4.6*progress;z=Math.sin(a)*(.18+progress*.60);size=.012+.012*Math.sin(progress*Math.PI);}
   // Exactly three samples per trail; no history buffers or accumulated objects.
   size*=1-trail*.24;
   const onset=smooth(0,.8,t);dummy.position.set(x,y,z);dummy.scale.setScalar(size*onset*(i<18?1:forming));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }mesh.instanceMatrix.needsUpdate=true;
 },dispose(){geometry.dispose();material.dispose();}};
}
