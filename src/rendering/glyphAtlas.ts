import * as THREE from 'three';
/** Coverage is measured once from the local font. No GPU readback is involved. */
export async function createGlyphAtlas() {
 await document.fonts.load('600 40px "IBM Plex Mono"');
 const size=48; const probe=document.createElement('canvas');probe.width=size;probe.height=size;
 const ctx=probe.getContext('2d',{willReadFrequently:true})!;
 ctx.font='600 42px "IBM Plex Mono"';ctx.textAlign='center';ctx.textBaseline='middle';
 const measured=Array.from({length:94},(_,i)=>String.fromCharCode(33+i)).map(char=>{
  ctx.clearRect(0,0,size,size);ctx.fillStyle='white';ctx.fillText(char,size/2,size/2);
  const data=ctx.getImageData(0,0,size,size).data;let sum=0;for(let i=3;i<data.length;i+=4)sum+=data[i];
  return {char,coverage:sum/(255*size*size)};
 }).sort((a,b)=>a.coverage-b.coverage);
 // Evenly spaced coverage bins avoid overrepresenting densely clustered glyphs.
 const glyphs=[' '];const min=measured[0].coverage,max=measured.at(-1)!.coverage;
 for(let i=0;i<31;i++){const target=min+(max-min)*i/30;glyphs.push(measured.reduce((best,g)=>Math.abs(g.coverage-target)<Math.abs(best.coverage-target)?g:best).char);}
 const atlas=document.createElement('canvas');atlas.width=size*glyphs.length;atlas.height=size;
 const a=atlas.getContext('2d')!;a.font=ctx.font;a.textAlign='center';a.textBaseline='middle';a.fillStyle='white';
 glyphs.forEach((g,i)=>a.fillText(g,i*size+size/2,size/2));
 const texture=new THREE.CanvasTexture(atlas);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;
 return {texture,count:glyphs.length,glyphs:glyphs.join(''),coverage:measured};
}
