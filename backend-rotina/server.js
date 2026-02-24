require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Em produção, o ideal é ter o JWT_SECRET no .env
// Se não tiver, usamos um fallback apenas para o servidor não crashar no boot
const SECRET = process.env.JWT_SECRET || "fallback_secreto_temporario";

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
    await prisma.userData.upsert({
      where: { userId: req.userId },
      update: { content },
      create: { userId: req.userId, content }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));