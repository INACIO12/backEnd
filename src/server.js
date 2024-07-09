const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const Groq = require('groq-sdk');

const app = express();
const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(bodyParser.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Rota de cadastro
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email já registrado' });

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar usuário' });
  }
});

// Rota de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ userId: user.id }, 'secret-key', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).send('Credenciais inválidas');
  }
});

// Rota para gerar API key
app.post('/generate-api-key', authenticateToken, async (req, res) => {
  const apiKey = uuidv4();
  const key = await prisma.apiKey.create({
    data: {
      key: apiKey,
      userId: req.user.userId,
    },
  });
  res.status(201).json({ apiKey: key.key });
});

// Rota para gerar token de acesso à API
app.post('/generate-access-token', authenticateToken, (req, res) => {
  const apiAccessToken = jwt.sign({ userId: req.user.userId }, 'api-access-secret-key', { expiresIn: '1h' });
  res.json({ token: apiAccessToken });
});

const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'api-access-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Nova rota para obter todas as chaves de API de um usuário
app.get('/api-keys', authenticateToken, async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.userId },
    });
    res.json(keys);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar as chaves de API' });
  }
});

// Rota protegida que consome a API externa (Groq)
app.post('/api/groq-chat', verifyAccessToken, async (req, res) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: req.body.message || "Explique a importância de modelos de linguagem rápidos",
        },
      ],
      model: "llama3-8b-8192",
    });
    res.json(chatCompletion.choices[0]?.message?.content || "");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao consumir a API do Groq' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});