import { useEffect,useRef,useState } from 'react';
import { createEngine } from '../scene/engine';
import { ReplayButton } from './ReplayButton';
export function BouquetScene() {
 const host=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null);const engine=useRef<Awaited<ReturnType<typeof createEngine>>>(null);const [error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();let local:Awaited<ReturnType<typeof createEngine>>=null;
  createEngine(canvas.current!,host.current!,controller.signal,setError).then(value=>{if(controller.signal.aborted){value?.dispose();return;}local=value;engine.current=value;}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Não foi possível iniciar a cena.');});
  return()=>{controller.abort();local?.dispose();engine.current=null;};
 },[]);
 return <main ref={host} className="relative h-dvh min-h-0 w-full overflow-hidden bg-[#05060e]" aria-label="Buquê de rosas negras em ASCII"><p id="scene-description" className="sr-only">Rosas em vermelho profundo quase preto, folhas verdes e laço cinza se formam em ASCII. Mini morcegos voam entre as flores. Neve mágica reage ao ponteiro, emite partículas e brilha ao clicar. Arraste horizontalmente para girar o buquê, ou use as setas esquerda e direita com o canvas em foco. Depois da formação, a frase Te amo surge em duas camadas de magia. A experiência respeita a preferência por movimento reduzido.</p><canvas ref={canvas} tabIndex={0} className="touch-none cursor-grab focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-rose-300/30" role="img" aria-describedby="scene-description" aria-label="Buquê interativo de rosas negras, morcegos e neve mágica"/>{error?<p role="alert" className="absolute inset-0 m-auto flex max-w-md items-center justify-center p-8 text-center text-sm leading-7 text-rose-100/80">{error}</p>:<ReplayButton onReplay={()=>engine.current?.replay()}/>}</main>;
}
