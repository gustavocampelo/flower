import { CONFIG } from '../scene/config';
/** Non-blocking GPU timer queries, if supported. Never force a GPU/CPU sync. */
export class PerformanceMonitor {
 private gl:WebGL2RenderingContext; private ext: { TIME_ELAPSED_EXT:number; GPU_DISJOINT_EXT:number } | null;
 private pending:WebGLQuery[]=[];private active:WebGLQuery|null=null;
 frames=0;cpuMs=0;gpuMs=0;fps=0;qualityLevel=0;measuredFrames=0;measuredMs=0;private count=0;private cpuTotal=0;private intervalTotal=0;private lastChange=0;
 constructor(gl:WebGL2RenderingContext){this.gl=gl;this.ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');}
 begin(){if(this.ext&&this.frames%30===0&&this.pending.length<4){this.active=this.gl.createQuery();if(this.active)this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT,this.active);}}
 end(cpu:number,interval:number,now:number){
  if(this.active&&this.ext){this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);this.pending.push(this.active);this.active=null;}
  if(this.ext&&this.pending.length){const q=this.pending[0];if(this.gl.getQueryParameter(q,this.gl.QUERY_RESULT_AVAILABLE)){if(!this.gl.getParameter(this.ext.GPU_DISJOINT_EXT)){const ms=this.gl.getQueryParameter(q,this.gl.QUERY_RESULT)/1e6;this.gpuMs=this.gpuMs?this.gpuMs*.85+ms*.15:ms;}this.gl.deleteQuery(q);this.pending.shift();}}
  this.frames++;if(interval<=0||interval>100)return false;if(this.frames>120){this.measuredFrames++;this.measuredMs+=interval;}this.count++;this.cpuTotal+=cpu;this.intervalTotal+=interval;
  if(this.count<CONFIG.performance.sampleCount)return false;this.cpuMs=this.cpuTotal/this.count;this.fps=1000/(this.intervalTotal/this.count);this.count=0;this.cpuTotal=0;this.intervalTotal=0;
  // Actual submission/GPU costs, not a 60 Hz display's 16.7 ms rAF interval.
  const cost=Math.max(this.cpuMs,this.gpuMs);if(now-this.lastChange<CONFIG.performance.settleSeconds*1000)return false;
  if(cost>CONFIG.performance.budgetMs*1.14&&this.qualityLevel<4){this.qualityLevel++;this.lastChange=now;return true;}
  if(cost<5&&this.qualityLevel>0&&now-this.lastChange>20000){this.qualityLevel--;this.lastChange=now;return true;}return false;
 }
 get gpuAvailable(){return !!this.ext;}
 dispose(){this.pending.forEach(q=>this.gl.deleteQuery(q));this.pending=[];}
}
