# Push Notifications Setup

## O que foi implementado

- `public/sw.js`: service worker para receber e exibir notificacoes
- `backend-rotina/server.js`: rotas de push, envio de teste e agendador de lembretes
- `src/context/RoutineContext.jsx`: estado e acoes para ativar/desativar/testar push
- `src/components/settings/SettingsPanel.jsx`: controles na interface

## Variaveis no backend

Configure estas variaveis no Render:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `APP_URL`
- `APP_TIME_ZONE`
- `PUSH_SCHEDULER_INTERVAL_MS`

Exemplo:

- `VAPID_SUBJECT=mailto:voce@seudominio.com`
- `APP_URL=https://seu-app.onrender.com`
- `APP_TIME_ZONE=America/Sao_Paulo`

Se `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` nao estiverem configuradas, o backend gera chaves temporarias para nao quebrar a ativacao. Para producao, configure chaves fixas no Render; chaves temporarias mudam quando o servidor reinicia e podem exigir ativar novamente no navegador.

## Gerar chaves VAPID

No terminal do backend:

```bash
npx web-push generate-vapid-keys
```

Copie a `Public Key` e a `Private Key` para o Render.

## Fluxo no app

1. Entrar no sistema
2. Abrir `Configuracoes`
3. Ativar `Push no celular`
4. Aceitar a permissao do navegador
5. Clicar em `Testar agora`

## Lembretes automaticos

Ao ativar push, o backend cria uma agenda diaria com 3 lembretes aleatorios:

- manha: entre 08:00 e 11:20
- tarde: entre 13:00 e 17:40
- noite: entre 19:00 e 21:45

Se o servidor estiver dormindo e acordar depois da janela, o lembrete perdido e pulado. Isso evita notificacoes ruins perto de 23:59 ou 00:00.

## Observacoes importantes

- Push web exige `HTTPS`
- No celular, o suporte depende do navegador
- Em iPhone, o comportamento funciona melhor quando o site esta instalado na tela inicial como web app
- O backend preserva as subscriptions do usuario sem depender de migracao nova no banco
- Se a permissao aparece mas a ativacao falha, redeploye tambem o backend no Render. A ativacao depende das rotas `/push/public-key`, `/push/subscribe` e `/push/status`.
- Se aparecer `Push notifications ainda nao estao configuradas no servidor`, gere chaves com `npm run vapid` dentro de `backend-rotina` e configure `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` no Render.
