# Estudo do My Routine

## O que entendi que o site e

O `My Routine` e um organizador pessoal de rotina com cara de sistema vivo, quase como um painel privado de acompanhamento diario.

Ele mistura quatro ideias:

- rotina semanal sorteada a partir de atividades cadastradas
- acompanhamento diario com checklist, notas e imagem
- biblioteca de atividades com regras proprias
- espacos paralelos para pensar, planejar e registrar ciclos pessoais

Mesmo que alguem encontre o link, a estrutura do produto passa uma sensacao de ferramenta pessoal, feita para uso intimo e recorrente, nao para consumo publico amplo.

## Como o produto parece funcionar

- `Semana`: mostra a rotina da semana e os cards do dia
- `Biblioteca`: guarda as atividades-base que podem entrar na rotina
- `Sandbox`: funciona como mural livre para ideias, imagens e cards puxados da biblioteca
- `Ciclos`: agora virou um kanban pessoal para acompanhar frentes em andamento
- `Metas`, `Estatisticas` e `Historico`: servem como memoria e acompanhamento
- `Configuracoes`: controla formato da rotina, tema, idioma e limites de sorteio

## Mudancas aplicadas

### Rotina

- a semana agora suporta mais de uma atividade no mesmo dia e no mesmo turno
- cada atividade do dia ganhou historico proprio, sem misturar notas, checklist ou conclusao com outra atividade
- foi adicionado controle de `atividades por dia/turno`
- atividades podem ser fixadas em dias especificos
- foi adicionada `chance de aparecer` com valores entre `0` e `1`

### Ciclos

- foi criada a aba `Ciclos`
- ela funciona como um kanban simples com colunas `Para fazer`, `Em andamento` e `Concluido`
- cada card pode receber notas
- cada card pode ser vinculado a uma atividade da biblioteca
- os cards vinculados aparecem dentro do card da atividade na semana

### Sandbox e barra

- o sandbox ficou maior
- a barra de acoes do sandbox ficou mais adaptavel em telas menores
- a navegacao mobile ficou mais estavel com todas as abas visiveis em grade

### Tema claro

- o modo claro foi corrigido
- antes so o modo escuro aplicava classe no documento
- agora `light` e `dark` sao aplicados corretamente

## Observacoes de implementacao

- os dados locais passaram a usar `routine_db_v12`
- o app ainda tenta aproveitar dados antigos quando existirem
- o build de producao foi validado com `npm.cmd run build`

## Proximos pontos que eu olharia depois

- permitir arrastar cards entre dias na semana
- permitir ordenar manualmente varias atividades dentro do mesmo dia
- mostrar limite visual quando um dia estiver muito carregado
- criar filtros no historico para atividade e ciclo
