import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createInteractiveMagic } from '../src/scene/interactiveMagic.ts';
import { CONFIG } from '../src/scene/config.ts';

test('neve sem interação é determinística e o Replay recupera a composição',()=>{
  const scene=new THREE.Scene(),magic=createInteractiveMagic(scene);
  magic.setBounds(10,8);magic.update(20,0,1,false);
  const snow=scene.children[0] as THREE.InstancedMesh;
  const reference=Array.from(snow.instanceMatrix.array);
  magic.move(new THREE.Vector3(1,1,2.25));magic.update(20,.1,1,false);magic.burst(false);
  magic.reset();magic.update(20,0,1,false);
  assert.deepEqual(Array.from(snow.instanceMatrix.array),reference);
  assert.equal(magic.stats().emissions,0);assert.equal(magic.stats().bursts,0);
  magic.dispose();assert.equal(scene.children.length,0);
});

test('muitos cliques reutilizam o pool e partículas expiram sem acumulação',()=>{
  const scene=new THREE.Scene(),magic=createInteractiveMagic(scene);
  const pool=scene.children[1] as THREE.InstancedMesh,buffer=pool.instanceMatrix.array;
  magic.move(new THREE.Vector3(0,0,2.25));
  for(let i=0;i<100;i++)magic.burst(false);
  magic.update(20,0,1,false);
  assert.equal(pool.count,CONFIG.interaction.emittedCount);
  assert.equal(pool.instanceMatrix.array,buffer);
  assert.equal(magic.stats().bursts,100);
  assert.ok(Array.from(buffer).every(Number.isFinite));
  magic.leave();magic.update(23,3,1,false);
  for(let i=0;i<pool.count;i++)assert.equal(buffer[i*16],0);
  magic.dispose();
});
