require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!req.body.message || !req.body.message.trim()) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-max',
        input: {
          messages: [{ role: 'user', content: req.body.message }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const reply = response.data.output.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.response) {
      console.error('❌ Qwen API Error Status:', error.response.status);
      console.error('❌ Qwen API Error Data:', JSON.stringify(error.response.data, null, 2));

      res.status(error.response.status).json({
        error: 'Error dari Qwen API',
        message: error.response.data.message || 'Terjadi kesalahan',
        code: error.response.data.code || 'UNKNOWN_ERROR',
      });
    } else if (error.request) {
      console.error('❌ No response received');
      res.status(500).json({
        error: 'Tidak ada respons dari server Qwen',
        message: 'Pastikan koneksi internet stabil dan API key valid',
      });
    } else {
      console.error('❌ Error details:', error.message);
      res.status(500).json({
        error: 'Terjadi kesalahan server',
        message: error.message,
      });
    }
  }
});

app.get('/api/status', (req, res) => {
  const hasKey = !!process.env.QWEN_API_KEY;
  const keyPreview = hasKey ? `${process.env.QWEN_API_KEY.substring(0, 8)}...${process.env.QWEN_API_KEY.slice(-4)}` : 'Tidak ada API Key';

  res.json({
    status: 'OK',
    port: PORT,
    apiKeyConfigured: hasKey,
    apiKeyPreview: keyPreview,
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/api/chat (POST)',
      status: '/api/status (GET)',
      test: '/api/test (GET)',
    },
  });
});

app.get('/api/test', async (req, res) => {
  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-max',
        input: {
          messages: [{ role: 'user', content: 'Halo, apakah kamu bisa merespons?' }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    res.json({
      success: true,
      message: '✅ Koneksi ke Qwen API berhasil!',
      testResponse: response.data.output.choices[0].message.content,
      model: 'qwen-max',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '❌ Gagal terhubung ke Qwen API',
      details: error.message,
      solution: 'Pastikan: 1) API key valid, 2) Model qwen-max sudah diaktifkan di DashScope',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route tidak ditemukan',
    path: req.originalUrl,
    availableEndpoints: ['/api/chat', '/api/status', '/api/test'],
  });
});

app.listen(PORT, () => {
  const hasKey = !!process.env.QWEN_API_KEY;

  console.log('\n' + '='.repeat(60));
  console.log('🚀 CHATBOT QWEN - SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🔑 API Key: ${hasKey ? '✓ TERKONFIGURASI' : '✗ BELUM DISET'}`);

  if (hasKey) {
    console.log(`📋 API Key Preview: ${process.env.QWEN_API_KEY.substring(0, 8)}...${process.env.QWEN_API_KEY.slice(-4)}`);
  }

  console.log('='.repeat(60));
  console.log('💡 Quick Test:');
  console.log(`   1. Buka: http://localhost:${PORT}`);
  console.log(`   2. Cek status: http://localhost:${PORT}/api/status`);
  console.log(`   3. Test API: http://localhost:${PORT}/api/test`);
  console.log('='.repeat(60) + '\n');
});
