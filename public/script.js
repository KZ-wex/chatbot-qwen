const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

userInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
});

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, 'user');

  userInput.value = '';
  userInput.style.height = 'auto';

  const loadingId = showLoading();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    removeLoading(loadingId);

    if (data.reply) {
      addMessage(data.reply, 'bot');
    } else {
      addMessage('Maaf, saya tidak bisa memproses permintaan ini.', 'bot');
    }

    scrollToBottom();
  } catch (error) {
    console.error('Error:', error);
    removeLoading(loadingId);
    addMessage(`❌ Error: ${error.message || 'Terjadi kesalahan'}`, 'bot');
  }
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message mb-3`;

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  messageDiv.innerHTML = `
    <div class="message-content">${escapedText.replace(/\n/g, '<br>')}</div>
    <small class="text-muted">${sender === 'user' ? 'You' : 'Bot'} • ${timeStr}</small>
  `;

  chatArea.appendChild(messageDiv);
  scrollToBottom();
}

function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot-message mb-3';
  loadingDiv.id = 'loading-' + Date.now();
  loadingDiv.innerHTML = `
    <div class="message-content">
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <small class="text-muted">Bot • Mengetik...</small>
  `;
  chatArea.appendChild(loadingDiv);
  scrollToBottom();
  return loadingDiv.id;
}

function removeLoading(id) {
  const loadingEl = document.getElementById(id);
  if (loadingEl) loadingEl.remove();
}

function scrollToBottom() {
  setTimeout(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 50);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const welcomeMsg = document.querySelector('.bot-message');
    if (welcomeMsg) {
      welcomeMsg.style.opacity = '1';
      welcomeMsg.style.transform = 'translateY(0)';
    }
  }, 300);
});
