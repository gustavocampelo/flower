import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectionParameters, smooth } from '../src/scene/timeline.ts';
import { seededRandom } from '../src/utils/seededRandom.ts';
import { butterflyPosition, butterflyState } from '../src/scene/butterflyBehavior.ts';
import { Vector3 } from 'three';

test('inspeção limita entradas inválidas e preserva os instantes pedidos',()=>{
 for(const t of [1,4,8,12,20])assert.deepEqual(inspectionParameters(`?t=${t}&paused=1`).time,t);
 assert.equal(inspectionParameters('?t=Infinity').time,0);
 assert.equal(inspectionParameters('?t=-5').time,0);
 assert.equal(inspectionParameters('?t=5&paused=1&debug=1').paused,true);
 assert.equal(inspectionParameters('?dpr=99').dpr,2);
});
test('semente fixa e avanço temporal não dependem da ordem de consulta',()=>{
 const a=seededRandom(73129),b=seededRandom(73129);
 for(let i=0;i<1000;i++)assert.equal(a(),b());
 const landing=new Vector3(.5,1.5,1),first=new Vector3(),later=new Vector3();
 butterflyPosition(20,1,landing,first,false);
 for(let t=0;t<80;t+=.013)butterflyPosition(t,1,landing,later,false);
 butterflyPosition(20,1,landing,later,false);
 assert.deepEqual(first.toArray(),later.toArray());
});
test('voo compartilhado mantém pousos locais e trajetórias contínuas',()=>{
 const landing=new Vector3(.5,1.5,1),a=new Vector3(),b=new Vector3();
 for(let i=0;i<4;i++){
  const perchedTime=12-i*5+21;
  assert.equal(butterflyState(perchedTime,i),'pousada');
  butterflyPosition(perchedTime,i,landing,a,false);assert.ok(a.distanceTo(landing)<1e-10);
  for(let t=8;t<70;t+=.05){butterflyPosition(t,i,landing,a,false);butterflyPosition(t+.001,i,landing,b,false);assert.ok(a.distanceTo(b)<.01,`salto em ${t}`);}
 }
});
test('revelação tem início/fim estáveis e progressão monotônica',()=>{
 assert.equal(smooth(4,9,0),0);assert.equal(smooth(4,9,20),1);
 let previous=0;for(let t=0;t<12;t+=.01){const value=smooth(4,9,t);assert.ok(value>=previous);previous=value;}
});

