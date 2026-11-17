import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { CONFIG } from './config';
import { smooth } from './timeline';
import { seededRandom } from '../utils/seededRandom';

/** Two genuine text meshes (spectral contour + solid lettering), both converted to ASCII. */
export function createLoveMessage(scene:THREE.Scene) {
  const font=new FontLoader().parse(fontData);
  const geometry=new TextGeometry(CONFIG.message.text,{font,size:.52,depth:.025,curveSegments:6,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1});
  geometry.computeBoundingBox();
  const width=geometry.boundingBox!.max.x-geometry.boundingBox!.min.x;
  geometry.translate(-width/2,0,0);
  const time={value:0};
  function layer(color:string,delay:number,wireframe:boolean) {
    const material=new THREE.MeshBasicMaterial({color,wireframe});
    material.onBeforeCompile=shader=>{
      shader.uniforms.uMessageTime=time;
      shader.vertexShader='varying vec3 vLetter;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLetter=position;');
      shader.fragmentShader='uniform float uMessageTime;varying vec3 vLetter;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
        float progress=clamp((uMessageTime-${(CONFIG.message.start+delay).toFixed(3)})/${CONFIG.message.duration.toFixed(3)},0.,1.);
        float front=-${(width/2+.06).toFixed(3)}+progress*${(width+.12).toFixed(3)};
        if(vLetter.x>front)discard;`);
    };
    material.customProgramCacheKey=()=>`love-layer-${delay}`;
    return new THREE.Mesh(geometry,material);
  }
  const root=new THREE.Group();root.position.set(0,-2.87,.9);scene.add(root);
  const ghost=layer('#9a648f',0,true);ghost.scale.setScalar(1.10);ghost.position.set(.018,-.012,-.04);
  const lettering=layer('#e5cbd8',.55,false);root.add(ghost,lettering);
  const sparkGeometry=new THREE.OctahedronGeometry(1,0),sparkMaterial=new THREE.MeshBasicMaterial({color:'#dba8cf'});
  const sparks=new THREE.InstancedMesh(sparkGeometry,sparkMaterial,100);sparks.frustumCulled=false;root.add(sparks);
  const random=seededRandom(CONFIG.seed+90),vertices=geometry.getAttribute('position');
  const points=Array.from({length:100},()=>{const index=Math.floor(random()*vertices.count);return {x:vertices.getX(index),y:vertices.getY(index),phase:random()*6.28};});
  const dummy=new THREE.Object3D();
  return {
    update(t:number,reduced:boolean) {
      const mt=reduced&&t>=12?20:t;time.value=mt;root.visible=mt>=CONFIG.message.start;
      const progress=smooth(CONFIG.message.start,CONFIG.message.start+CONFIG.message.duration+.7,mt);
      ghost.position.x=.018+(reduced?0:Math.sin(t*1.2)*.018);
      for(let i=0;i<points.length;i++) {
        const p=points[i],scatter=1-progress;
        dummy.position.set(p.x+Math.cos(p.phase+mt*.4)*scatter*1.4,p.y+Math.sin(p.phase+mt*.4)*scatter*.7,.08+scatter*.3);
        const twinkle=.5+.5*Math.sin(mt*2+p.phase);
        dummy.scale.setScalar((progress<1?.018:.008)*twinkle*(reduced?.4:1));dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);
      }
      sparks.instanceMatrix.needsUpdate=true;
    },
    dispose(){geometry.dispose();ghost.material.dispose();lettering.material.dispose();sparkGeometry.dispose();sparkMaterial.dispose();scene.remove(root);},
  };
}
