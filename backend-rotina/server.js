require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE PROTEÇÃO ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado' });

  try {
    const verified = jwt.verify(token, SECRET);
    req.userId = verified.id;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
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

    res.json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// 2. Login
a// Substitua o app.post('/auth/login'...) por isto:

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log("1. Tentativa de login para:", email);

  try {
    // 1. Busca usuário
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.log("2. Usuário não encontrado no banco.");
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    console.log("2. Usuário encontrado ID:", user.id);

    // 2. Checa senha
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      console.log("3. Senha incorreta.");
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    console.log("3. Senha válida.");

    // 3. Verifica JWT_SECRET (O erro comum é aqui!)
    if (!process.env.JWT_SECRET) {
      throw new Error("ERRO CRÍTICO: JWT_SECRET não está definido no arquivo .env");
    }

    // 4. Gera Token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log("4. Token gerado com sucesso.");
    
    // Tenta buscar dados extras (se existirem)
    let userData = {};
    try {
        // Se você mudou o schema para ter UserData separado
        const dataRecord = await prisma.userData.findUnique({ where: { userId: user.id } });
        if (dataRecord) userData = dataRecord.content;
    } catch (err) {
        console.log("Aviso: Sem dados extras ou tabela antiga.");
    }

    res.json({ 
      token, 
      user: { 
          name: user.name, 
          email: user.email,
          avatar: `https://ui-avatars.com/api/?name=${user.name}&background=random`
      },
      data: userData 
    });

  } catch (error) {
    // --- O ERRO REAL VAI APARECER AQUI ---
    console.error("❌ ERRO FATAL NO LOGIN:", error); 
    res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
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
    res.status(500).json({ error: 'Erro ao carregar dados' });
  }
});

// 4. Salvar Dados (Save)
app.post('/data', authenticate, async (req, res) => {
  const content = req.body; // O JSON completo do frontend
  try {
    await prisma.userData.upsert({
      where: { userId: req.userId },
      update: { content },
      create: { userId: req.userId, content }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));