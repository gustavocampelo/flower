import * as THREE from 'three';
export type SurfacePoint = { x: number; y: number; z: number; shade?: number };
/** Batches all botanical surfaces into one draw call. Timing lives on vertices. */
export class BotanicalGeometry {
  positions: number[] = []; colors: number[] = []; times: number[] = []; origins: number[] = []; phases: number[] = []; indices: number[] = [];
  secondaryRanges: [number,number][]=[];
  surface(fn: (u: number, v: number) => SurfacePoint, nu: number, nv: number, color: string, matrix: THREE.Matrix4, start: number, spread = 0.28, origin = new THREE.Vector3(), phase = 0) {
    const offset = this.positions.length / 3; const c = new THREE.Color(color); const p = new THREE.Vector3(); const o = origin.clone().applyMatrix4(matrix);
    for (let j=0;j<=nv;j++) for (let i=0;i<=nu;i++) {
      const s = fn(i/nu,j/nv); p.set(s.x,s.y,s.z).applyMatrix4(matrix);
      this.positions.push(p.x,p.y,p.z); const shade = s.shade ?? 1;
      this.colors.push(c.r*shade,c.g*shade,c.b*shade); this.times.push(start+j/nv*spread); this.origins.push(o.x,o.y,o.z); this.phases.push(phase);
    }
    for(let j=0;j<nv;j++) for(let i=0;i<nu;i++) { const a=offset+j*(nu+1)+i,b=a+nu+1; this.indices.push(a,b,a+1,b,b+1,a+1); }
  }
  tube(curve: THREE.Curve<THREE.Vector3>, radius: number, color: string, start: number, duration: number, phase=0) {
    const frames=curve.computeFrenetFrames(28,false); const p=new THREE.Vector3();
    this.surface((u,v)=>{const i=Math.min(28,Math.round(v*28)); curve.getPoint(v,p); const a=u*Math.PI*2; const n=frames.normals[i],b=frames.binormals[i]; return {x:p.x+radius*(n.x*Math.cos(a)+b.x*Math.sin(a)), y:p.y+radius*(n.y*Math.cos(a)+b.y*Math.sin(a)),z:p.z+radius*(n.z*Math.cos(a)+b.z*Math.sin(a)),shade:.8+.2*Math.sin(a)};},6,28,color,new THREE.Matrix4(),start,duration,new THREE.Vector3(),phase);
  }
  build() {
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3)); g.setAttribute('aStart',new THREE.Float32BufferAttribute(this.times,1)); g.setAttribute('aOrigin',new THREE.Float32BufferAttribute(this.origins,3)); g.setAttribute('aPhase',new THREE.Float32BufferAttribute(this.phases,1)); g.setIndex(this.indices); g.computeVertexNormals(); return g;
  }
}
export function transform(p: readonly number[], rotation: readonly number[] = [0,0,0], scale=1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(scale,scale,scale));
}
export function botanicalMaterial(time: {value:number}) {
  const material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.8,metalness:.03});
  material.onBeforeCompile = shader => {
    shader.uniforms.uTime=time;
    shader.vertexShader='uniform float uTime; attribute float aStart; attribute vec3 aOrigin; attribute float aPhase; varying float vGrowth;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`float growth = smoothstep(aStart, aStart + 0.85, uTime);
      vGrowth = uTime - aStart;
      vec3 transformed = mix(aOrigin + (position-aOrigin)*vec3(0.30,0.30,0.62),position,growth);
      float sway = sin(uTime*0.65+position.y*1.3)*0.018*max(0.0,position.y+0.8);
      transformed.x += sway;
      transformed.z += sin(uTime*0.52+aPhase)*0.012*max(0.0,position.y+0.8);`);
    shader.fragmentShader='varying float vGrowth;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vGrowth<0.0) discard;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.19,0.10,0.04) * (1.0-smoothstep(0.0,0.5,vGrowth));');
  };
  return material;
}
