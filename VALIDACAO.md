# Registro de validação

Verificado em 17/11/2026. Projeto iniciado do zero: a pasta estava vazia, sem repositório Git ou instruções `AGENTS.md` aplicáveis encontradas. Nenhum commit foi criado.

## Ambiente

- Windows, Node.js 26.13.1 e npm 11.20.0.
- CPU: Intel Core i5-13400F.
- GPU: Intel Arc B580, driver 32.0.101.8826.
- Tela configurada em 144 Hz.
- Navegador integrado do Codex, DPR observado igual a 1.
- Servidor Vite em desenvolvimento: `http://127.0.0.1:5174/`.

A instalação precisou de acesso ao registro npm fora do isolamento de rede. O servidor também precisou executar fora desse isolamento para ficar acessível ao navegador local. Isso não exige mudanças no código para executar normalmente na máquina do usuário.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| `npm.cmd install` | Concluído; lockfile gerado; auditoria informou zero vulnerabilidades |
| `npm.cmd run typecheck` | Aprovado |
| `npm.cmd test` | 4 testes aprovados |
| `npm.cmd run build` | Aprovado; TypeScript e bundle de produção gerados |
| Servidor local e abertura no navegador | Aplicação carregada e renderizando |
| `t=1&paused=1` | Primeiros caracteres e pequenos trechos inferiores de caules |
| `t=4&paused=1` | Caules e folhas em formação; magia discreta |
| `t=8&paused=1` | Flores abertas/em abertura, laço parcialmente formado |
| `t=12&paused=1` | Buquê completo e borboletas presentes |
| `t=20`, sem pausa | Rotação, profundidade e voo contínuo observados |
| Replay após formação | Reiniciou sem navegação/recarregamento |
| Replay durante formação | Reiniciou a timeline corretamente |
| Replays consecutivos | 10 acionamentos em uma rodada; mais 5 após aquecimento em outra |
| Desktop | Inspeção em 1280×720 e 1101×883 |
| Mobile | Emulação de viewport 390×844; margens de voo corrigidas e verificadas |
| Resize | Alteração de viewport sem reconstrução da página ou reinício da timeline |
| Teclado | Replay acionado com Enter |
| Movimento reduzido | Caminho compartilhado com `prefers-reduced-motion` exercitado via `debug=1&motion=reduce` |
| Console | Nenhum erro ou aviso de runtime capturado nas inspeções finais |

O build informa o aviso de bundle JavaScript acima de 500 kB: aproximadamente 759 kB sem compressão / 213 kB gzip, incluindo React e Three.js. Não é erro de compilação. As fontes são locais e limitadas ao subconjunto latino usado.

## Refinamentos decorrentes da inspeção

- Aumentada a densidade da grade para preservar detalhes das pétalas.
- Ajustados o peso da fonte, a seleção por cobertura e o contraste do ASCII.
- Preservada a relação entre canais de cor para evitar que as rosas ficassem esbranquiçadas.
- Ajustadas a curvatura, a sobreposição e a tonalidade das pétalas; geometria também conferida no diagnóstico sem pós-processamento.
- Corrigida a área de voo móvel depois de observar uma asa cortada na borda esquerda.
- Adicionados contornos de materialização nas asas e amostras finitas nos rastros.

## Desempenho observado

Medição durante formação e movimento contínuo, em build de desenvolvimento, com qualidade máxima interna (`quality: 0`):

| Métrica | Observação |
| --- | --- |
| Viewport da amostra contínua | 1101×883 CSS px |
| DPR | 1 |
| Grade ASCII | 324×155 células |
| Amostra acumulada | 91,0 segundos de intervalos válidos após aquecimento |
| FPS médio informado | 144,0 |
| Última janela de 240 frames | 144,0 FPS |
| CPU, última janela | 0,30 ms por frame de atualização/submissão |
| GPU, média móvel das consultas | 0,52 ms |
| Draw calls no estado completo | 31, incluindo o pós-processamento |
| Triângulos no estado completo | 99.858 |
| Qualidade adaptativa | Não precisou reduzir qualidade |

Após cinco replays adicionais, o contador acumulado chegou a 112,8 segundos válidos, ainda com média informada de 144 FPS. Outra leitura mostrou CPU de 0,31 ms e GPU de 0,82 ms. Em janelas anteriores de 1280×720, foram observados aproximadamente 141–144 FPS, CPU entre 0,22–0,51 ms e GPU entre 0,43–2,08 ms.

Metodologia: o contador acumulado ignora os primeiros 120 frames e intervalos individuais acima de 100 ms; a aba oculta não avança o relógio. Portanto, a média é da cadência ativa medida, e não uma análise de percentis, tempo de carregamento ou travamentos longos. CPU representa submissão, e GPU vem da extensão de timer queries, sem leitura de framebuffer. A ferramenta de inspeção e outras aplicações podem afetar os resultados.

Esses números demonstram a meta de 120 FPS neste ambiente específico. Não são garantia para outros computadores, telas, navegadores ou resoluções. O teste móvel foi de layout no mesmo desktop, não em hardware de celular.

## Recursos e memória

Depois que todas as fases foram usadas pela primeira vez, os contadores estabilizaram em **21 geometrias, 3 texturas e 6 programas**. A primeira materialização de asas adiciona recursos de contorno que ainda não tinham sido enviados à GPU ao abrir diretamente em `t=12`; esse aumento inicial é esperado.

Os mesmos contadores foram mantidos depois dos cinco replays adicionais. Na rodada contínua, o heap informado passou de 20,7 MB para 21,7 MB. Na rodada anterior de dez replays, chegou a 37,2 MB e depois caiu para 31,4 MB com a coleta normal. Não foi observado crescimento contínuo dos recursos gráficos ou erro de contexto. Isso é uma verificação prática limitada, não uma prova formal de ausência de vazamentos por heap snapshots de longa duração.

## Limites da verificação

- O caminho de movimento reduzido foi simulado pelo diagnóstico; a preferência do sistema operacional não foi alterada.
- Ausência/perda real de WebGL e redução adaptativa sob carga extrema não foram forçadas no navegador.
- O comportamento de aba oculta está implementado, mas não foi cronometrado em um teste dedicado de suspensão.
- O build de produção foi compilado; a sessão visual e as medições foram feitas no servidor de desenvolvimento.

Capturas locais: `artifacts/buque-desktop.jpg` e `artifacts/buque-mobile.jpg`.
