# Push Notifications Setup

## O que foi implementado

- `public/sw.js`: service worker para receber e exibir notificacoes
- `backend-rotina/server.js`: rotas de push e envio de notificacao de teste
- `src/context/RoutineContext.jsx`: estado e acoes para ativar/desativar/testar push
- `src/components/settings/SettingsPanel.jsx`: controles na interface

## Variaveis no backend

Configure estas variaveis no Render:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `APP_URL`

Exemplo:

- `VAPID_SUBJECT=mailto:voce@seudominio.com`
- `APP_URL=https://seu-app.onrender.com`

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

## Observacoes importantes

- Push web exige `HTTPS`
- No celular, o suporte depende do navegador
- Em iPhone, o comportamento funciona melhor quando o site esta instalado na tela inicial como web app
- O backend preserva as subscriptions do usuario sem depender de migracao nova no banco
