import * as THREE from 'three';
import { CONFIG } from './config';
import { createBouquet } from './createBouquet';
import { createBats } from './createBats';
import { createInteractiveMagic } from './interactiveMagic';
import { createLoveMessage } from './createLoveMessage';
import { createMagicParticles } from './magicParticles';
import { inspectionParameters } from './timeline';
import { createAsciiRenderer } from '../rendering/asciiRenderer';
import { PerformanceMonitor } from '../rendering/performanceMonitor';
export async function createEngine(canvas:HTMLCanvasElement,host:HTMLElement,signal:AbortSignal,onError:(message:string)=>void) {
 const params=inspectionParameters(location.search);const query=new URLSearchParams(location.search);const raw=params.debug&&query.get('raw')==='1';const reducedOverride=params.debug&&query.get('motion')==='reduce';const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches||reducedOverride;
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});}catch{throw new Error('Seu navegador não conseguiu iniciar o WebGL 2. Ative a aceleração gráfica ou tente outro navegador para ver o buquê.');}
 renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.info.autoReset=false;
 let ascii:Awaited<ReturnType<typeof createAsciiRenderer>>;
 try{ascii=await createAsciiRenderer(renderer,params.dpr);}catch(e){renderer.dispose();throw e;}
 if(signal.aborted){ascii.dispose();renderer.dispose();return null;}
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(CONFIG.camera.fov,1,.1,50);const time={value:0};const bouquet=createBouquet(time);scene.add(bouquet.root);
 scene.add(new THREE.HemisphereLight('#c9d3ff','#263128',2.0));
 const key=new THREE.DirectionalLight('#fff0db',3.5);key.position.set(-3,5,6);scene.add(key);
 const fill=new THREE.DirectionalLight('#c9b5ef',1.1);fill.position.set(4,1,2);scene.add(fill);
 const rim=new THREE.DirectionalLight('#e7b9c5',1.8);rim.position.set(-2,3,-4);scene.add(rim);
 const bats=createBats(bouquet.root,bouquet.landings);const magic=createMagicParticles(bouquet.root);
 const interactiveMagic=createInteractiveMagic(scene);const loveMessage=createLoveMessage(scene);
 const perf=new PerformanceMonitor(renderer.getContext() as WebGL2RenderingContext);
 let elapsed=reduced&&!location.search.includes('t=')?12:params.time;let paused=params.paused;let previous=0;let raf=0;let disposed=false;let mobile=false;let replays=0;let fade=1;let replayPending=false;
 let rotation=0,rotationTarget=0,dragging=false,dragPointer=-1,lastX=0,downX=0,downY=0,moved=0,manuallyRotated=false;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),hit=new THREE.Vector3();
 const pointerPlane=new THREE.Plane(new THREE.Vector3(0,0,1),-2.25);
 function updatePointer(event:PointerEvent){const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(pointerPlane,hit))interactiveMagic.move(hit);}
 function pointerMove(event:PointerEvent){updatePointer(event);if(dragging&&event.pointerId===dragPointer){rotationTarget+=(event.clientX-lastX)*CONFIG.interaction.dragSensitivity;lastX=event.clientX;moved=Math.max(moved,Math.hypot(event.clientX-downX,event.clientY-downY));if(moved>5)manuallyRotated=true;}}
 function pointerDown(event:PointerEvent){if(!event.isPrimary||event.button!==0)return;updatePointer(event);dragging=true;dragPointer=event.pointerId;lastX=downX=event.clientX;downY=event.clientY;moved=0;canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';}
 function pointerUp(event:PointerEvent){if(event.pointerId!==dragPointer)return;updatePointer(event);if(moved<6)interactiveMagic.burst(reduced);dragging=false;dragPointer=-1;canvas.style.cursor='grab';if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(event.pointerType!=='mouse')interactiveMagic.leave();}
 function pointerCancel(){dragging=false;dragPointer=-1;canvas.style.cursor='grab';interactiveMagic.leave();}
 function lostCapture(){dragging=false;dragPointer=-1;canvas.style.cursor='grab';}
 function pointerLeave(){if(!dragging)interactiveMagic.leave();}
 function keyDown(event:KeyboardEvent){if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();rotationTarget+=(event.key==='ArrowRight'?1:-1)*.2;manuallyRotated=true;}}
 canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);canvas.addEventListener('lostpointercapture',lostCapture);canvas.addEventListener('pointerleave',pointerLeave);canvas.addEventListener('keydown',keyDown);
 let debug:HTMLPreElement|null=null;let lastDebug=0;let contextErrors=0;
 if(params.debug){debug=document.createElement('pre');debug.className='pointer-events-none absolute left-3 top-3 z-20 rounded-lg bg-black/70 p-3 text-[10px] text-white/80';debug.setAttribute('aria-hidden','true');host.appendChild(debug);}
 const errors:string[]=[];const onWindowError=(event:ErrorEvent)=>{errors.push(event.message);if(errors.length>5)errors.shift();};window.addEventListener('error',onWindowError);
 function resize(){const w=host.clientWidth,h=host.clientHeight;mobile=w<600;camera.aspect=w/h;const fitHeight=Math.max(CONFIG.camera.minHeight,(mobile?CONFIG.camera.mobileWidth:CONFIG.camera.desktopWidth)/camera.aspect);const distance=fitHeight/(2*Math.tan(THREE.MathUtils.degToRad(CONFIG.camera.fov/2)));camera.position.set(0,.55,distance);camera.lookAt(0,.10,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();interactiveMagic.setBounds(fitHeight*camera.aspect*1.15,fitHeight*1.15);ascii.resize(w,h);}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function visibility(){previous=0;}document.addEventListener('visibilitychange',visibility);
 function preference(){reduced=media.matches||reducedOverride;if(reduced)elapsed=Math.max(12,elapsed);}media.addEventListener('change',preference);
 function lost(event:Event){event.preventDefault();contextErrors++;cancelAnimationFrame(raf);onError('A conexão com a GPU foi interrompida. Recarregue a página para restaurar a cena.');}canvas.addEventListener('webglcontextlost',lost);
 const memory=performance as Performance & {memory?:{usedJSHeapSize:number}};
 function frame(now:number){
  if(disposed)return;raf=requestAnimationFrame(frame);if(document.hidden){previous=0;return;}
  const delta=previous?Math.min((now-previous)/1000,.05):0;const interval=previous?now-previous:0;previous=now;const begin=performance.now();
  if(replayPending){fade=Math.max(0,fade-delta*7);if(fade===0){elapsed=reduced?10:0;replayPending=false;paused=false;rotation=rotationTarget=0;manuallyRotated=false;interactiveMagic.reset();}}
  else{fade=Math.min(1,fade+delta*4);if(!paused)elapsed+=delta;}
  const t=reduced&&elapsed>=12?12+(elapsed-12)*.035:elapsed;time.value=t;
  rotation+=(rotationTarget-rotation)*(1-Math.exp(-delta*14));
  const autoRotation=reduced?0:Math.max(0,elapsed-12)*Math.PI*2/CONFIG.rotationPeriod;
  if(!manuallyRotated)rotation=rotationTarget=autoRotation;
  bouquet.root.rotation.y=rotation;
  bats.update(t,mobile,reduced);magic.update(t,perf.qualityLevel>=1?.42:1,reduced);
  interactiveMagic.update(elapsed,delta,perf.qualityLevel>=1?.55:1,reduced);loveMessage.update(elapsed,reduced);ascii.uniforms.uDim.value=fade;
  renderer.info.reset();perf.begin();
  if(raw){renderer.setRenderTarget(null);renderer.setClearColor(CONFIG.background);renderer.render(scene,camera);}else ascii.render(scene,camera);
  const changed=perf.end(performance.now()-begin,interval,now);
  if(changed){rim.visible=perf.qualityLevel<2;
   bouquet.mesh.geometry=perf.qualityLevel>=3?bouquet.lowGeometry:bouquet.geometry;
   ascii.setQuality(perf.qualityLevel>=4?.88:1);
  }
  if(debug&&now-lastDebug>500){lastDebug=now;debug.textContent=JSON.stringify({time:+elapsed.toFixed(2),paused,replays,rotation:+rotation.toFixed(3),manuallyRotated,interaction:interactiveMagic.stats(),fps:+perf.fps.toFixed(1),averageFps:perf.measuredMs?+(perf.measuredFrames*1000/perf.measuredMs).toFixed(1):0,measuredSeconds:+(perf.measuredMs/1000).toFixed(1),cpuMs:+perf.cpuMs.toFixed(2),gpuMs:perf.gpuAvailable?+perf.gpuMs.toFixed(2):'indisponível',quality:perf.qualityLevel,viewport:[host.clientWidth,host.clientHeight],dpr:renderer.getPixelRatio(),ascii:ascii.uniforms.uGrid.value.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length,heapMB:memory.memory?+(memory.memory.usedJSHeapSize/1048576).toFixed(1):null,bats:bats.bats.map(b=>b.state),contextErrors,errors},null,2);}
 }
 raf=requestAnimationFrame(frame);
 return {replay(){replays++;replayPending=true;},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);window.removeEventListener('error',onWindowError);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);canvas.removeEventListener('lostpointercapture',lostCapture);canvas.removeEventListener('pointerleave',pointerLeave);canvas.removeEventListener('keydown',keyDown);debug?.remove();perf.dispose();bats.dispose();magic.dispose();interactiveMagic.dispose();loveMessage.dispose();bouquet.geometry.dispose();bouquet.lowGeometry.dispose();bouquet.material.dispose();ascii.dispose();renderer.dispose();}};
}



