import * as THREE from 'three';
import { CONFIG } from '../scene/config';
import { createGlyphAtlas } from './glyphAtlas';
export async function createAsciiRenderer(renderer:THREE.WebGLRenderer,dprCap:number) {
 const atlas=await createGlyphAtlas();
 const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,type:THREE.UnsignedByteType,depthBuffer:true});
 const uniforms={tScene:{value:target.texture},tAtlas:{value:atlas.texture},uGrid:{value:new THREE.Vector2(1,1)},uCount:{value:atlas.count},uDim:{value:1}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
 vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`precision highp float;
 uniform sampler2D tScene;uniform sampler2D tAtlas;uniform vec2 uGrid;uniform float uCount;uniform float uDim;varying vec2 vUv;
 void main(){
  vec2 cell=floor(vUv*uGrid);vec2 center=(cell+.5)/uGrid;
  vec3 col=texture2D(tScene,center).rgb;
  float lum=dot(col,vec3(.2126,.7152,.0722));
  float level=clamp(pow(lum,.60)*1.60,0.,1.);
  float index=lum<.002?0.:max(1.,floor(level*(uCount-1.)+.5));
  vec2 local=fract(vUv*uGrid);
  // Font has a 0.6 advance/em; the atlas padding is cropped to preserve glyph proportions.
  vec2 glyphUV=vec2((index+.20+local.x*.60)/uCount,.06+local.y*.88);
  float ink=texture2D(tAtlas,glyphUV).a;
  vec3 base=vec3(.0196,.0235,.0549);
  float peak=max(col.r,max(col.g,col.b));
  vec3 tint=pow(col/max(peak,.001),vec3(.72))*min(1.,pow(peak,.40)*1.75);
  gl_FragColor=vec4(mix(base,tint,ink*uDim),1.);
 }`});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);const scene=new THREE.Scene();scene.add(quad);const camera=new THREE.Camera();
 let width=1,height=1,quality=1;
 function resize(w:number,h:number,q=quality) {width=w;height=h;quality=q;renderer.setPixelRatio(Math.min(window.devicePixelRatio,dprCap));renderer.setSize(w,h,false); const mobile=w<600;const cw=(mobile?2.6:CONFIG.ascii.cellWidth)/q;const ch=(mobile?4.4:CONFIG.ascii.cellHeight)/q;const cols=Math.ceil(w/cw),rows=Math.ceil(h/ch);uniforms.uGrid.value.set(cols,rows);target.setSize(cols*CONFIG.ascii.samples,rows*CONFIG.ascii.samples);}
 return {atlas,uniforms,target,resize,setQuality(q:number){resize(width,height,q);},render(world:THREE.Scene,cam:THREE.Camera){renderer.setRenderTarget(target);renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(world,cam);renderer.setRenderTarget(null);renderer.render(scene,camera);},dispose(){target.dispose();atlas.texture.dispose();material.dispose();quad.geometry.dispose();}};
}
