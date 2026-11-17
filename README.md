# Rosas negras em ASCII

Buquê 3D procedural de oito rosas em vermelho profundo quase preto, folhas verdes e laço cinza, acompanhado por quatro mini morcegos. Toda a cena — inclusive neve mágica e a frase **Te amo** — passa pelo pós-processamento ASCII na GPU. A única interface convencional visível é o botão Replay.

## Executar

Requer Node.js 22.18+ e um navegador com WebGL 2.

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

No Windows PowerShell, se `npm.ps1` estiver bloqueado:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Abra a URL Local informada pelo Vite. Normalmente é `http://127.0.0.1:5173`; a sessão de desenvolvimento desta implementação utiliza `http://127.0.0.1:5174/`. Para escolher uma porta: `npm.cmd run dev -- --port 5174`.

O build estático fica em `dist/`; `preview` normalmente usa a porta 4173. Fontes e dependências visuais são locais. Não há backend ou chave de API.

## Interações

- **Hover:** a neve se afasta suavemente do ponteiro, com um pequeno movimento circular. O próprio ponteiro emite partículas continuamente.
- **Clique/toque:** produz um sparkle radial de curta duração, na posição acionada.
- **Arraste horizontal:** gira o buquê, com suavização. Após a primeira rotação manual, o arranjo conserva a orientação escolhida. O texto e a neve permanecem independentes dessa rotação.
- **Teclado:** com o canvas em foco, use as setas esquerda/direita para girar. Replay é acessível por Tab e Enter.
- **Replay:** reinicia formação, rotação, magia, morcegos e escrita. Reutiliza os recursos gráficos e o único RAF.

Há 720 partículas de neve na qualidade normal e um pool fixo de 384 partículas para emissões e cliques. Não há acumulação infinita. A neve cai lentamente, em diferentes profundidades. O clique e o arraste são diferenciados por um limiar de movimento.

## Formação e mensagem

A formação do buquê dura aproximadamente 12 segundos, com revelação espacial de caules, folhas, pétalas e laço. Os mini morcegos têm membranas curvas com bordas recortadas, dedos das asas, corpo, cabeça, orelhas e olhos. Voam, aproximam-se das rosas e pousam com batimentos individuais.

A partir de 12,25 segundos, **Te amo** se revela da esquerda para a direita em duas camadas: um contorno espectral e, 550 ms depois, letras preenchidas. Partículas convergem para a geometria das letras. A mensagem permanece após a revelação e só reinicia por Replay.

## Inspeção e diagnóstico

```text
/?t=1&paused=1
/?t=4&paused=1
/?t=8&paused=1
/?t=12&paused=1
/?t=13.6&paused=1
/?t=17&paused=1
/?t=20&paused=1
```

A semente fixa é `73129`. Sem entradas do usuário, as posições, a formação, a neve e a escrita são funções determinísticas do tempo. Efeitos criados por gestos usam um relógio próprio e podem ser exercitados mesmo em inspeção pausada; recarregar ou usar Replay limpa essas entradas.

- `/?debug=1`: FPS, CPU/GPU, recursos gráficos, memória, rotação, estados de voo e contadores de hover/emissão/clique.
- `/?t=17&paused=1&debug=1&raw=1`: geometria convencional apenas para diagnóstico.
- `/?debug=1&motion=reduce`: exercita o caminho de movimento reduzido.
- `/?dpr=1`: limite de devicePixelRatio; padrão 1,5, faixa aceita 0,5–2.

## Arquitetura

React SPA, Vite, TypeScript, Tailwind CSS e Three.js.

- `src/scene/config.ts`: composição, paleta, câmera, orçamento e parâmetros dos novos efeitos.
- `geometry.ts`, `createRose.ts`, `createFoliage.ts`, `createRibbon.ts`, `createBouquet.ts`: superfícies curvas, caules, pétalas e revelação por vértice.
- `createBats.ts`: morcegos procedurais. Reutiliza as trajetórias analíticas de `butterflyBehavior.ts` da primeira versão.
- `magicParticles.ts`: magia original da formação, com rastros finitos.
- `interactiveMagic.ts`: neve, resposta ao hover e pool de emissões/sparkles.
- `createLoveMessage.ts`: geometria das letras, duas camadas de revelação e convergência de partículas.
- `engine.ts`: câmera, ciclo de vida, Pointer Events, rotação e renderização.
- `rendering/glyphAtlas.ts`: atlas da IBM Plex Mono local, ordenado pela cobertura real de pixels.
- `rendering/asciiRenderer.ts`: render target com profundidade e conversão final em ASCII.
- `rendering/performanceMonitor.ts`: medição agregada e qualidade adaptativa.

O pipeline renderiza primeiro geometria e iluminação em resolução proporcional à grade ASCII. O shader final escolhe um caractere imprimível pela luminância e usa a cor da célula. Entre os caracteres há somente o fundo, sem imagem 3D convencional sobreposta. A cobertura da fonte é medida uma única vez em Canvas 2D; não há leitura de framebuffer GPU por quadro.

## Desempenho e acessibilidade

Um único `requestAnimationFrame`, animação baseada em tempo, nenhum estado React por frame, partículas instanciadas e buffers reutilizados. A meta é 120 FPS em hardware compatível, sem garantia universal. A qualidade adaptativa considera custo CPU/GPU, não reduz qualidade apenas por uma tela operar a 60 Hz e prioriza a redução de partículas secundárias. A medição GPU usa consultas assíncronas quando a extensão está disponível.

`ResizeObserver`, viewport dinâmico e área de voo móvel preservam o enquadramento. Pointer Events com captura permitem arrastar sem perder o gesto ao sair do canvas. Os listeners, queries, geometrias, materiais, texturas e RAF são liberados ao desmontar, inclusive em React StrictMode.

`prefers-reduced-motion` mostra a composição pronta, mantém a mensagem legível, reduz a neve e a intensidade das interações e fixa o voo e a rotação automática. A rotação solicitada diretamente pelo usuário continua disponível. Replay usa uma formação abreviada. O canvas possui descrição em português, foco visível e alternativa de rotação por teclado. A aba oculta pausa a timeline sem saltos ao retornar.

## Verificações

`npm test` cobre determinismo, continuidade do voo, pouso, entradas de inspeção, restauração da neve por Replay e cem cliques no mesmo pool, incluindo expiração das partículas. O histórico e as condições das medições estão em `VALIDACAO.md`.
