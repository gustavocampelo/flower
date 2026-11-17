import * as THREE from 'three';
import { CONFIG } from './config.ts';
import { seededRandom } from '../utils/seededRandom.ts';
import { smooth } from './timeline.ts';

/** Fixed-capacity pools: snow is analytic; user gestures add short-lived particles. */
export function createInteractiveMagic(scene: THREE.Scene) {
  const random=seededRandom(CONFIG.seed+408);
  const snowSeeds=Array.from({length:CONFIG.interaction.snowCount},()=>({
    x:random(), y:random(), z:random()*5-2, phase:random()*Math.PI*2,
    speed:.12+random()*.21, size:.012+random()*.017,
  }));
  const geometry=new THREE.OctahedronGeometry(1,0);
  const material=new THREE.MeshBasicMaterial({color:'#ffffff'});
  const snow=new THREE.InstancedMesh(geometry,material,CONFIG.interaction.snowCount);
  const sparks=new THREE.InstancedMesh(geometry,material,CONFIG.interaction.emittedCount);
  snow.frustumCulled=sparks.frustumCulled=false;
  snow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const palette=['#d3c2df','#9480af','#cfa7b5','#ddd3d9','#a5afc9'];
  for(let i=0;i<snow.count;i++)snow.setColorAt(i,new THREE.Color(palette[i%palette.length]).multiplyScalar(.45+(i%5)*.09));
  for(let i=0;i<sparks.count;i++)sparks.setColorAt(i,new THREE.Color(i%3===0?'#ffe2d1':i%3===1?'#e9bfdb':'#c9bbff'));
  scene.add(snow,sparks);
  const births=new Float64Array(sparks.count).fill(-Infinity);
  const life=new Float32Array(sparks.count),origins=new Float32Array(sparks.count*3),velocities=new Float32Array(sparks.count*3),sizes=new Float32Array(sparks.count);
  const matrix=new THREE.Object3D(),position=new THREE.Vector3(),target=new THREE.Vector3();
  let active=false, initialized=false, cursor=0, accumulator=0,clock=0,width=10,height=8,emissions=0,bursts=0;
  function emit(count:number,burst:boolean,reduced:boolean) {
    for(let i=0;i<count;i++) {
      const slot=cursor++%sparks.count,k=slot*3,angle=random()*Math.PI*2;
      const speed=(burst?.5+random()*1.9:.06+random()*.34)*(reduced?.35:1);
      births[slot]=clock;life[slot]=burst?1.1+random()*.7:.75+random()*.65;
      origins[k]=position.x;origins[k+1]=position.y;origins[k+2]=2.25+(random()-.5)*.12;
      velocities[k]=Math.cos(angle)*speed;velocities[k+1]=Math.sin(angle)*speed+(burst?.2:.13);velocities[k+2]=(random()-.5)*speed*.45;
      sizes[slot]=burst?.025+random()*.035:.016+random()*.018;emissions++;
    }
  }
  return {
    setBounds(w:number,h:number){width=w;height=h;},
    move(point:THREE.Vector3){target.copy(point);active=true;if(!initialized){position.copy(target);initialized=true;}},
    leave(){active=false;},
    burst(reduced:boolean){position.copy(target);emit(reduced?16:88,true,reduced);bursts++;},
    reset(){births.fill(-Infinity);cursor=0;accumulator=0;clock=0;emissions=0;bursts=0;active=false;initialized=false;},
    stats(){return {hover:active,emissions,bursts,snow:snow.count};},
    update(t:number,delta:number,quality:number,reduced:boolean) {
      clock+=delta;position.lerp(target,1-Math.exp(-delta*15));
      if(active){accumulator+=delta*(reduced?8:60);const n=Math.floor(accumulator);accumulator-=n;if(n>0)emit(Math.min(n,12),false,reduced);}
      snow.count=reduced?90:Math.round(CONFIG.interaction.snowCount*quality);
      const onset=smooth(0,1.4,t),motionTime=reduced?t*.06:t;
      for(let i=0;i<snow.count;i++) {
        const seed=snowSeeds[i];
        let x=(seed.x-.5)*width+Math.sin(motionTime*.27+seed.phase)*.22;
        let y=(.5-((seed.y+motionTime*seed.speed/height)%1))*height;
        let z=seed.z;
        if(active){const dx=x-position.x,dy=y-position.y,distance=Math.hypot(dx,dy);
          const influence=1-smooth(0,CONFIG.interaction.hoverRadius,distance);
          x+=(dx/Math.max(.05,distance)*.65-dy*.25)*influence;
          y+=(dy/Math.max(.05,distance)*.65+dx*.25)*influence;z+=influence*.32;
        }
        matrix.position.set(x,y,z);matrix.scale.setScalar(seed.size*onset*(.65+.35*Math.sin(motionTime*.8+seed.phase)**2));matrix.updateMatrix();snow.setMatrixAt(i,matrix.matrix);
      }
      for(let i=0;i<sparks.count;i++) {
        const age=clock-births[i],k=i*3;
        if(age<0||age>life[i])matrix.scale.setScalar(0);
        else {
          const drag=(1-Math.exp(-age*1.6))/1.6;
          matrix.position.set(origins[k]+velocities[k]*drag,origins[k+1]+velocities[k+1]*drag-age*age*.22,origins[k+2]+velocities[k+2]*drag);
          const twinkle=.60+.40*Math.cos(age*18+i)**2;
          matrix.scale.setScalar(sizes[i]*(1-age/life[i])*twinkle);
        }
        matrix.updateMatrix();sparks.setMatrixAt(i,matrix.matrix);
      }
      snow.instanceMatrix.needsUpdate=true;sparks.instanceMatrix.needsUpdate=true;
    },
    dispose(){geometry.dispose();material.dispose();scene.remove(snow,sparks);},
  };
}
