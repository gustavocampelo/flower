import * as THREE from 'three';
import { butterflyPosition as flightPosition, butterflyState as flightState } from './butterflyBehavior';
import { CONFIG } from './config';
import { smooth } from './timeline';

/** A curved membrane with three concave trailing scallops, stretched over finger bones. */
function membrane() {
  const contour = new THREE.Shape();
  contour.moveTo(0, .10);
  contour.quadraticCurveTo(.27, .44, .74, .40);
  contour.quadraticCurveTo(.52, .21, .60, -.08);
  contour.quadraticCurveTo(.36, .08, .38, -.23);
  contour.quadraticCurveTo(.19, -.08, .16, -.31);
  contour.quadraticCurveTo(.08, -.15, 0, -.20);
  contour.closePath();
  const geometry = new THREE.ShapeGeometry(contour, 12);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    positions.setZ(i, .10 * Math.sin(positions.getX(i) * 4.5));
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createBats(parent: THREE.Group, landings: THREE.Vector3[]) {
  const wingGeometry = membrane();
  const fur = new THREE.MeshStandardMaterial({ color: '#48434e', roughness: 1 });
  const membraneMaterial = new THREE.MeshStandardMaterial({ color: '#66506b', side: THREE.DoubleSide, roughness: .85 });
  const boneMaterial = new THREE.MeshStandardMaterial({ color: '#aa879c', roughness: .8 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#db6981' });
  const bodyGeometry = new THREE.SphereGeometry(1, 10, 8);
  const earGeometry = new THREE.ConeGeometry(.065, .20, 5);
  const eyeGeometry = new THREE.SphereGeometry(.018, 5, 4);
  const boneGeometries: THREE.BufferGeometry[] = [];
  const fingers = [[.74,.40], [.60,-.08], [.38,-.23], [.16,-.31]];
  for (const [x,y] of fingers) {
    boneGeometries.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0,.08,.015), new THREE.Vector3(x*.48,y*.4+.15,.11),
      new THREE.Vector3(x,y,.10*Math.sin(x*4.5)),
    ), 10, .009, 4, false));
  }
  const bats = Array.from({ length: 4 }, (_, i) => {
    const root = new THREE.Group();
    const wings: THREE.Group[] = [];
    for (const side of [-1,1]) {
      const wing = new THREE.Group();
      wing.scale.x = side;
      wing.add(new THREE.Mesh(wingGeometry, membraneMaterial));
      for (const geometry of boneGeometries) wing.add(new THREE.Mesh(geometry, boneMaterial));
      root.add(wing); wings.push(wing);
      const ear = new THREE.Mesh(earGeometry, fur);
      ear.position.set(side*.065,.24,0); ear.rotation.z = -side*.23; root.add(ear);
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye.position.set(side*.042,.13,.10); root.add(eye);
    }
    const body = new THREE.Mesh(bodyGeometry, fur); body.scale.set(.10,.21,.085); root.add(body);
    const head = new THREE.Mesh(bodyGeometry, fur); head.scale.set(.115,.10,.10); head.position.y=.13; root.add(head);
    parent.add(root);
    return { root, wings, landing: landings[i*2].clone(), state: 'surgindo' };
  });
  const pos = new THREE.Vector3(), next = new THREE.Vector3();
  return {
    bats,
    update(t: number, mobile: boolean, reduced: boolean) {
      for (let i=0;i<bats.length;i++) {
        const bat=bats[i];
        const onset=CONFIG.timeline.butterflyStart+i*CONFIG.timeline.butterflyStagger;
        const appear=smooth(onset,onset+1.4,t);
        bat.root.visible=appear>0;bat.root.scale.setScalar(.68*appear);
        const motionTime=reduced?23+i*.2:t;
        const perched=flightPosition(motionTime,i,bat.landing,pos,mobile);
        flightPosition(motionTime+.04,i,bat.landing,next,mobile);
        const bank=Math.atan2(-(next.x-pos.x),.03+next.y-pos.y)*.12;
        for(let j=0;j<CONFIG.flowers.length;j++) {
          if(j===i*2&&perched>.8)continue;
          const f=CONFIG.flowers[j], dx=pos.x-f.p[0],dy=pos.y-f.p[1],dz=pos.z-f.p[2];
          const distance=Math.hypot(dx,dy,dz),radius=f.r+.18;
          if(distance<radius)pos.set(f.p[0]+dx*radius/Math.max(.001,distance),f.p[1]+dy*radius/Math.max(.001,distance),f.p[2]+dz*radius/Math.max(.001,distance));
        }
        pos.x+=Math.sin(t*.65+bat.landing.y*1.3)*.018*(bat.landing.y+.8)*perched;
        pos.z+=Math.sin(t*.52+i*.94)*.012*(bat.landing.y+.8)*perched;
        bat.root.position.copy(pos);bat.state=flightState(motionTime,i);
        bat.root.rotation.set(.08,Math.sin(t*.4+i)*.16,bank*(1-perched));
        const flap=reduced?.22: .20+Math.sin(t*(perched>.98?2.0:6.2+i*.45)*Math.PI*2+i)*(perched>.98?.12:.62);
        bat.wings[0].rotation.y=-flap;bat.wings[1].rotation.y=flap;
      }
    },
    dispose() {
      wingGeometry.dispose();bodyGeometry.dispose();earGeometry.dispose();eyeGeometry.dispose();
      boneGeometries.forEach(g=>g.dispose());fur.dispose();membraneMaterial.dispose();boneMaterial.dispose();eyeMaterial.dispose();
    },
  };
}
