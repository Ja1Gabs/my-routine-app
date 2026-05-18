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
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if ((!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) && process.env.ALLOW_EPHEMERAL_VAPID !== 'false') {
  const generatedKeys = webpush.generateVAPIDKeys();
  VAPID_PUBLIC_KEY = generatedKeys.publicKey;
  VAPID_PRIVATE_KEY = generatedKeys.privateKey;
  console.warn('[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY nao configuradas. Usando chaves temporarias; configure env vars no Render para manter as inscricoes apos restart.');
}

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
const PUSH_SCHEDULE_KEY = '__pushReminderSchedule';
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'America/Sao_Paulo';
const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'https://my-routine-app-jxx7.onrender.com';
const PUSH_SCHEDULER_INTERVAL_MS = Math.max(60_000, Number(process.env.PUSH_SCHEDULER_INTERVAL_MS) || 60_000);
const PUSH_REMINDER_WINDOWS = {
  morning: { label: 'manha', start: 8 * 60, end: 11 * 60 + 20 },
  afternoon: { label: 'tarde', start: 13 * 60, end: 17 * 60 + 40 },
  night: { label: 'noite', start: 19 * 60, end: 21 * 60 + 45 },
};
const PUSH_REMINDER_MESSAGES = {
  morning: [
    'Passando aqui cedo para lembrar do seu plano. Escolha uma tarefa pequena e abre o dia com tracao.',
    'Bom dia. Seu My Routine separou esse lembrete para voce tocar uma atividade sem pressa.',
    'Primeiro checkpoint do dia: vale fazer so o proximo passo.',
  ],
  afternoon: [
    'Checkpoint da tarde. Da uma olhada na rotina e salva pelo menos uma entrega pequena.',
    'Meio do dia pede ajuste fino: escolha uma tarefa e mantem o ritmo vivo.',
    'Lembrete da tarde: nao precisa fazer tudo, so nao deixar o dia sumir.',
  ],
  night: [
    'Fechamento do dia. Se ainda der, marque uma tarefa e deixa a sequencia protegida.',
    'Ultimo lembrete de hoje: revisa sua rotina antes de desligar.',
    'A noite chegou. Um passo pequeno agora ainda conta muito.',
  ],
};

const zonedFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const getZonedNowParts = (date = new Date()) => {
  const parts = Object.fromEntries(
    zonedFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour || 0);
  const minute = Number(parts.minute || 0);

  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + minute,
  };
};

const randomMinuteBetween = (start, end) => Math.floor(Math.random() * (end - start + 1)) + start;

const formatScheduleTime = (minutes) => {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
};

const buildDailyPushSchedule = (dateStr) => ({
  dateStr,
  timezone: APP_TIME_ZONE,
  slots: Object.fromEntries(
    Object.entries(PUSH_REMINDER_WINDOWS).map(([slotKey, window]) => {
      const at = randomMinuteBetween(window.start, window.end);
      return [
        slotKey,
        {
          at,
          time: formatScheduleTime(at),
          sent: false,
          skipped: false,
        },
      ];
    })
  ),
});

const normalizeDailyPushSchedule = (schedule, nowParts = getZonedNowParts()) => {
  if (!schedule || schedule.dateStr !== nowParts.dateStr || typeof schedule.slots !== 'object') {
    return buildDailyPushSchedule(nowParts.dateStr);
  }

  return {
    ...schedule,
    dateStr: nowParts.dateStr,
    timezone: APP_TIME_ZONE,
    slots: Object.fromEntries(
      Object.entries(PUSH_REMINDER_WINDOWS).map(([slotKey, window]) => {
        const previousSlot = schedule.slots?.[slotKey] || {};
        const previousAt = Number(previousSlot.at);
        const at = Number.isFinite(previousAt)
          ? Math.min(window.end, Math.max(window.start, previousAt))
          : randomMinuteBetween(window.start, window.end);

        return [
          slotKey,
          {
            ...previousSlot,
            at,
            time: formatScheduleTime(at),
            sent: Boolean(previousSlot.sent),
            skipped: Boolean(previousSlot.skipped),
          },
        ];
      })
    ),
  };
};

const getPushScheduleFromContent = (content = {}, nowParts = getZonedNowParts()) =>
  normalizeDailyPushSchedule(content?.[PUSH_SCHEDULE_KEY], nowParts);

const pickReminderMessage = (slotKey) => {
  const messages = PUSH_REMINDER_MESSAGES[slotKey] || PUSH_REMINDER_MESSAGES.afternoon;
  return messages[Math.floor(Math.random() * messages.length)];
};

const buildReminderPayload = (slotKey, slotData) => ({
  title: 'My Routine',
  body: pickReminderMessage(slotKey),
  url: APP_URL,
  icon: '/logo-my-routine.svg',
  badge: '/logo-my-routine.svg',
  tag: `routine-reminder-${slotKey}-${slotData?.time || 'now'}`,
});

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

const mergeContentWithPushSubscriptions = (content = {}, subscriptions = [], schedule = null) => {
  const safeContent = content && typeof content === 'object' ? content : {};
  const nextContent = {
    ...safeContent,
    [PUSH_STORAGE_KEY]: subscriptions,
  };

  const nextSchedule = schedule || safeContent[PUSH_SCHEDULE_KEY] || null;
  if (nextSchedule) nextContent[PUSH_SCHEDULE_KEY] = nextSchedule;

  return nextContent;
};

const getUserDataRecord = async (userId) =>
  prisma.userData.findUnique({
    where: { userId }
  });

const savePushState = async (userId, { subscriptions = null, schedule = null } = {}) => {
  const existingRecord = await getUserDataRecord(userId);
  const existingContent = existingRecord?.content && typeof existingRecord.content === 'object' ? existingRecord.content : {};
  const nextSubscriptions = subscriptions || getPushSubscriptionsFromContent(existingContent);
  const nextContent = mergeContentWithPushSubscriptions(existingContent, nextSubscriptions, schedule);

  await prisma.userData.upsert({
    where: { userId },
    update: { content: nextContent },
    create: { userId, content: nextContent }
  });
};

const savePushSubscriptions = async (userId, subscriptions = []) =>
  savePushState(userId, { subscriptions });

const savePushSchedule = async (userId, schedule) =>
  savePushState(userId, { schedule });

const pushConfigIsReady = () => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

const sendPushPayloadToSubscriptions = async (userId, subscriptions, payloadObject) => {
  const payload = JSON.stringify(payloadObject);
  const activeSubscriptions = [];
  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
        activeSubscriptions.push(subscription);
        delivered += 1;
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
    await savePushSubscriptions(userId, activeSubscriptions);
  }

  return { delivered, activeSubscriptions };
};

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
    const preservedPushSchedule = existingContent[PUSH_SCHEDULE_KEY] || null;
    const nextContent = mergeContentWithPushSubscriptions(content, preservedPushSubscriptions, preservedPushSchedule);

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
    const nextSchedule = getPushScheduleFromContent(existingContent);

    await savePushState(req.userId, { subscriptions: nextSubscriptions, schedule: nextSchedule });
    res.json({ success: true, total: nextSubscriptions.length, schedule: nextSchedule });
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

app.post('/push/status', authenticate, async (req, res) => {
  try {
    const endpoint = req.body?.endpoint || '';
    const existingRecord = await getUserDataRecord(req.userId);
    const existingContent = existingRecord?.content && typeof existingRecord.content === 'object' ? existingRecord.content : {};
    const subscriptions = getPushSubscriptionsFromContent(existingContent);
    const schedule = getPushScheduleFromContent(existingContent);

    res.json({
      ready: pushConfigIsReady(),
      matched: endpoint ? subscriptions.some((subscription) => subscription.endpoint === endpoint) : false,
      total: subscriptions.length,
      schedule,
      usingTemporaryVapid: !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY,
    });
  } catch (error) {
    console.error('Erro ao verificar status de push:', error);
    res.status(500).json({ error: 'Erro ao verificar notificacoes.' });
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

    const payload = {
      title: 'My Routine',
      body: 'Push funcionando. Seu navegador recebeu uma notificacao de teste.',
      url: APP_URL,
      icon: '/logo-my-routine.svg',
      badge: '/logo-my-routine.svg',
      tag: 'routine-test',
    };

    const { delivered } = await sendPushPayloadToSubscriptions(req.userId, subscriptions, payload);

    res.json({ success: true, delivered });
  } catch (error) {
    console.error('Erro ao enviar notificacao de teste:', error);
    res.status(500).json({ error: 'Erro ao enviar notificacao de teste.' });
  }
});

let pushSchedulerRunning = false;

const processDueRoutineReminders = async () => {
  if (!pushConfigIsReady() || pushSchedulerRunning) return;

  pushSchedulerRunning = true;

  try {
    const nowParts = getZonedNowParts();
    const records = await prisma.userData.findMany({
      select: {
        userId: true,
        content: true,
      },
    });

    for (const record of records) {
      const content = record.content && typeof record.content === 'object' ? record.content : {};
      const subscriptions = getPushSubscriptionsFromContent(content);
      if (subscriptions.length === 0) continue;

      const previousSchedule = content[PUSH_SCHEDULE_KEY] || null;
      const schedule = normalizeDailyPushSchedule(previousSchedule, nowParts);
      let scheduleChanged = JSON.stringify(previousSchedule) !== JSON.stringify(schedule);

      for (const [slotKey, window] of Object.entries(PUSH_REMINDER_WINDOWS)) {
        const slot = schedule.slots?.[slotKey];
        if (!slot || slot.sent || slot.skipped) continue;

        if (nowParts.minutes > window.end) {
          slot.skipped = true;
          slot.skippedAt = new Date().toISOString();
          scheduleChanged = true;
          continue;
        }

        if (nowParts.minutes < slot.at) continue;

        const { delivered } = await sendPushPayloadToSubscriptions(
          record.userId,
          subscriptions,
          buildReminderPayload(slotKey, slot)
        );

        slot.sent = true;
        slot.sentAt = new Date().toISOString();
        slot.delivered = delivered;
        scheduleChanged = true;
      }

      if (scheduleChanged) {
        await savePushSchedule(record.userId, schedule);
      }
    }
  } catch (error) {
    console.error('Erro no agendador de notificacoes:', error);
  } finally {
    pushSchedulerRunning = false;
  }
};

const startPushReminderScheduler = () => {
  const firstRun = setTimeout(() => {
    processDueRoutineReminders();
  }, 5_000);
  firstRun.unref?.();

  const interval = setInterval(processDueRoutineReminders, PUSH_SCHEDULER_INTERVAL_MS);
  interval.unref?.();

  console.log(`[push] Agendador ativo: manha/tarde/noite em ${APP_TIME_ZONE}, intervalo ${PUSH_SCHEDULER_INTERVAL_MS / 1000}s.`);
};

startPushReminderScheduler();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT} no host 0.0.0.0`);
});
