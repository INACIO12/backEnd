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

// Função para verificar a API Key
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.sendStatus(401);

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
  });

  if (!key) return res.sendStatus(403);

  req.user = { userId: key.userId };
  next();
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
  const { name } = req.body;
  const apiKey = uuidv4();
  const key = await prisma.apiKey.create({
    data: {
      key: apiKey,
      name: name || 'Default API Key Name',
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
app.post('/api/groq-chat', verifyApiKey, async (req, res) => {
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


app.delete('/api-keys/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verifique se a API Key existe
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: parseInt(id) },
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API Key not found' });
    }

    // Apague a API Key
    await prisma.apiKey.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'API Key deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.patch('/api-keys/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    // Verifique se a API Key existe
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: parseInt(id) },
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API Key not found' });
    }

    // Atualize o nome da API Key
    const updatedApiKey = await prisma.apiKey.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.status(200).json(updatedApiKey);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.patch('/users/name', authenticateToken, async (req, res) => {
  const newUsername = req.body.username;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { username: newUsername },
    });

    res.json({ message: `Username updated to ${newUsername}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating username' });
  }
});

app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

app.get('/apikeys/count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.apiKey.count({
      where: { userId: req.userId },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).send('Error fetching API key count');
  }
});




app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
