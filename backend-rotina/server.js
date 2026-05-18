require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Em produção, o ideal é ter o JWT_SECRET no .env
// Se não tiver, usamos um fallback apenas para o servidor não crashar no boot
const SECRET = process.env.JWT_SECRET || "fallback_secreto_temporario";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE PROTEÇÃO ---
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mal formatado' });

  try {
    const verified = jwt.verify(token, SECRET);
    req.userId = verified.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

const PUSH_STORAGE_KEY = '__pushSubscriptions';

const normalizePushSubscription = (subscription = {}) => {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return null;

  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };
};

const getPushSubscriptionsFromContent = (content = {}) => {
  const subscriptions = Array.isArray(content?.[PUSH_STORAGE_KEY]) ? content[PUSH_STORAGE_KEY] : [];
  return subscriptions.map(normalizePushSubscription).filter(Boolean);
};

const mergeContentWithPushSubscriptions = (content = {}, subscriptions = []) => ({
  ...(content && typeof content === 'object' ? content : {}),
  [PUSH_STORAGE_KEY]: subscriptions,
});

const getUserDataRecord = async (userId) =>
  prisma.userData.findUnique({
    where: { userId }
  });

const savePushSubscriptions = async (userId, subscriptions = []) => {
  const existingRecord = await getUserDataRecord(userId);
  const existingContent = existingRecord?.content && typeof existingRecord.content === 'object' ? existingRecord.content : {};
  const nextContent = mergeContentWithPushSubscriptions(existingContent, subscriptions);

  await prisma.userData.upsert({
    where: { userId },
    update: { content: nextContent },
    create: { userId, content: nextContent }
  });
};

const pushConfigIsReady = () => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

// --- ROTAS DE AUTH ---

// 1. Registrar
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Verifica se já existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    // Criptografa senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria usuário
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });

    // Cria entrada inicial vazia de dados (opcional, mas evita erro no primeiro load)
    try {
        await prisma.userData.create({
            data: { userId: user.id, content: {} }
        });
    } catch (e) {
        console.log("Info: Não foi possível criar dados iniciais, serão criados no primeiro save.");
    }

    res.json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: 'Erro no servidor ao registrar' });
  }
});

// 2. Login (Versão Robusta/Blindada)
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log("--> Login iniciado para:", email);

  try {
    // A. Busca usuário
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("--> Usuário não encontrado");
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // B. Checa senha
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      console.log("--> Senha incorreta");
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // C. Gera Token
    // Usa a constante SECRET definida no topo (do env ou fallback)
    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    
    // D. Tenta buscar dados (Com try/catch isolado para não quebrar o login se o banco de dados de conteúdo falhar)
    let userData = {};
    try {
        const dataRecord = await prisma.userData.findUnique({ where: { userId: user.id } });
        if (dataRecord && dataRecord.content) {
            userData = dataRecord.content;
        } else {
            console.log("--> Usuário sem dados salvos (UserData), retornando vazio.");
        }
    } catch (dbError) {
        console.error("--> Erro não-fatal ao buscar dados do usuário:", dbError.message);
        // Não faz nada, apenas segue o login retornando objeto vazio
    }

    console.log("--> Login Sucesso!");
    
    res.json({ 
      token, 
      user: { 
          name: user.name, 
          email: user.email,
          // Avatar gerado automaticamente para UI
          avatar: `https://ui-avatars.com/api/?name=${user.name}&background=random`
      },
      data: userData 
    });

  } catch (error) {
    console.error("--> ❌ ERRO CRÍTICO NO LOGIN:", error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// --- ROTAS DE DADOS (SYNC) ---

// 3. Baixar Dados (Load)
app.get('/data', authenticate, async (req, res) => {
  try {
    const userData = await prisma.userData.findUnique({
      where: { userId: req.userId }
    });
    // Se não tiver dados, retorna vazio
    res.json(userData ? userData.content : {});
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    res.status(500).json({ error: 'Erro ao carregar dados' });
  }
});

// 4. Salvar Dados (Save)
app.post('/data', authenticate, async (req, res) => {
  const content = req.body; // O JSON completo do frontend
  try {
    const existingRecord = await getUserDataRecord(req.userId);
    const existingContent = existingRecord?.content && typeof existingRecord.content === 'object' ? existingRecord.content : {};
    const preservedPushSubscriptions = getPushSubscriptionsFromContent(existingContent);
    const nextContent = mergeContentWithPushSubscriptions(content, preservedPushSubscriptions);

    await prisma.userData.upsert({
      where: { userId: req.userId },
      update: { content: nextContent },
      create: { userId: req.userId, content: nextContent }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

app.get('/push/public-key', authenticate, async (req, res) => {
  if (!pushConfigIsReady()) {
    return res.status(503).json({ error: 'Push notifications ainda nao estao configuradas no servidor.' });
  }

  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/push/subscribe', authenticate, async (req, res) => {
  if (!pushConfigIsReady()) {
    return res.status(503).json({ error: 'Push notifications ainda nao estao configuradas no servidor.' });
  }

  const subscription = normalizePushSubscription(req.body?.subscription);
  if (!subscription) {
    return res.status(400).json({ error: 'Subscription invalida.' });
  }

  try {
    const existingRecord = await getUserDataRecord(req.userId);
    const existingContent = existingRecord?.content && typeof existingRecord.content === 'object' ? existingRecord.content : {};
    const existingSubscriptions = getPushSubscriptionsFromContent(existingContent);
    const nextSubscriptions = [
      subscription,
      ...existingSubscriptions.filter((item) => item.endpoint !== subscription.endpoint),
    ];

    await savePushSubscriptions(req.userId, nextSubscriptions);
    res.json({ success: true, total: nextSubscriptions.length });
  } catch (error) {
    console.error('Erro ao salvar subscription:', error);
    res.status(500).json({ error: 'Erro ao registrar notificacoes.' });
  }
});

app.post('/push/unsubscribe', authenticate, async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint obrigatorio.' });
  }

  try {
    const existingRecord = await getUserDataRecord(req.userId);
    const existingContent = existingRecord?.content && typeof existingRecord.content === 'object' ? existingRecord.content : {};
    const existingSubscriptions = getPushSubscriptionsFromContent(existingContent);
    const nextSubscriptions = existingSubscriptions.filter((item) => item.endpoint !== endpoint);

    await savePushSubscriptions(req.userId, nextSubscriptions);
    res.json({ success: true, total: nextSubscriptions.length });
  } catch (error) {
    console.error('Erro ao remover subscription:', error);
    res.status(500).json({ error: 'Erro ao remover notificacao.' });
  }
});

app.post('/push/test', authenticate, async (req, res) => {
  if (!pushConfigIsReady()) {
    return res.status(503).json({ error: 'Push notifications ainda nao estao configuradas no servidor.' });
  }

  try {
    const userData = await getUserDataRecord(req.userId);
    const subscriptions = getPushSubscriptionsFromContent(userData?.content);

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Nenhum dispositivo inscrito para este usuario.' });
    }

    const payload = JSON.stringify({
      title: 'My Routine',
      body: 'Push funcionando. Seu navegador recebeu uma notificacao de teste.',
      url: process.env.APP_URL || 'https://example.com',
      icon: '/logo-my-routine.svg',
      badge: '/logo-my-routine.svg',
      tag: 'routine-test',
    });

    const activeSubscriptions = [];
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, payload);
          activeSubscriptions.push(subscription);
        } catch (error) {
          const statusCode = error?.statusCode || 0;
          if (statusCode !== 404 && statusCode !== 410) {
            console.error('Erro ao enviar push:', error);
            activeSubscriptions.push(subscription);
          }
        }
      })
    );

    if (activeSubscriptions.length !== subscriptions.length) {
      await savePushSubscriptions(req.userId, activeSubscriptions);
    }

    res.json({ success: true, delivered: activeSubscriptions.length });
  } catch (error) {
    console.error('Erro ao enviar notificacao de teste:', error);
    res.status(500).json({ error: 'Erro ao enviar notificacao de teste.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT} no host 0.0.0.0`);
});
