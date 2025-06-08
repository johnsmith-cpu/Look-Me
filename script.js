document.addEventListener('DOMContentLoaded', () => {
    const backendBaseUrl = 'http://localhost:8080/api';
    const authContainer = document.getElementById('authContainer');
    const chatContainer = document.getElementById('chatContainer');
    const authMessage = document.getElementById('authMessage');
    const regU = document.getElementById('registerUsername'), regP = document.getElementById('registerPassword'), regB = document.getElementById('registerBtn');
    const logU = document.getElementById('loginUsername'), logP = document.getElementById('loginPassword'), logB = document.getElementById('loginBtn');
    const currentUsernameDisplay = document.getElementById('currentUsernameDisplay');
    const contactListUl = document.getElementById('contactList');
    const chatPartnerNameDisplay = document.getElementById('chatPartnerName');
    const chatPartnerStatusDisplay = document.getElementById('chatPartnerStatus');
    const messagesDisplay = document.getElementById('messagesDisplay');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');

    let currentUsername = '';
    let currentChatPartner = '';
    let stompClient = null;

    regB.addEventListener('click', async () => {
        const u = regU.value.trim(), p = regP.value.trim();
        if (!u || !p) { displayAuthMessage('Enter username and password.', 'error'); return; }
        try {
            const res = await fetch(`${backendBaseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, passwordHash: p }) });
            const msg = await res.text();
            displayAuthMessage(msg, res.ok ? 'success' : 'error');
            if (res.ok) { regU.value = ''; regP.value = ''; }
        } catch (e) { console.error('Reg error:', e); displayAuthMessage('Error during registration.', 'error'); }
    });

    logB.addEventListener('click', async () => {
        const u = logU.value.trim(), p = logP.value.trim();
        if (!u || !p) { displayAuthMessage('Enter username and password.', 'error'); return; }
        try {
            const res = await fetch(`${backendBaseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
            const msg = await res.text();
            if (res.ok) {
                displayAuthMessage(msg, 'success');
                currentUsername = u;
                localStorage.setItem('loggedInUser', u);
                showChatInterface();
                connectToWebSocket(u);
                fetchContacts();
            } else { displayAuthMessage(msg, 'error'); }
        } catch (e) { console.error('Login error:', e); displayAuthMessage('Error during login.', 'error'); }
    });

    function displayAuthMessage(msg, type) {
        authMessage.textContent = msg;
        authMessage.className = `message ${type}`;
        setTimeout(() => authMessage.textContent = '', 5000);
    }

    function showChatInterface() {
        authContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        currentUsernameDisplay.textContent = currentUsername;
    }

    const storedUsername = localStorage.getItem('loggedInUser');
    if (storedUsername) {
        currentUsername = storedUsername;
        showChatInterface();
        connectToWebSocket(storedUsername);
        fetchContacts();
    }

    function connectToWebSocket(username) {
        const socket = new SockJS('http://localhost:8080/ws');
        stompClient = Stomp.over(socket);
        stompClient.connect({ 'username': username }, onConnected, onError);
    }

    function onConnected() {
        console.log('WS Connected');
        stompClient.subscribe('/topic/public', onPublicMessageReceived);
        stompClient.subscribe(`/user/${currentUsername}/queue/messages`, onPrivateMessageReceived);
    }

    function onError(error) { console.error('WS Error:', error); }

    function onPublicMessageReceived(payload) {
        const msg = JSON.parse(payload.body);
        if (msg.senderUsername === 'System') {
             const contactItem = document.querySelector(`li[data-username="${msg.content.split(' ')[0]}"]`);
             if (contactItem) {
                 const statusSpan = contactItem.querySelector('.contact-status');
                 if (statusSpan) {
                     statusSpan.className = 'contact-status ' + (msg.content.includes('Online') ? 'status-online' : 'status-offline');
                 }
             }
        }
    }

    function onPrivateMessageReceived(payload) {
        const msg = JSON.parse(payload.body);
        if (msg.senderUsername === currentChatPartner || msg.recipientUsername === currentChatPartner) {
            displayMessage(msg.senderUsername, msg.content, 'received');
        }
    }

    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    function sendMessage() {
        const content = messageInput.value.trim();
        if (content && stompClient && currentChatPartner) {
            const chatMsg = { senderUsername: currentUsername, recipientUsername: currentChatPartner, content: content, timestamp: new Date().toLocaleTimeString() };
            stompClient.send(`/app/chat.sendMessage/${currentChatPartner}`, {}, JSON.stringify(chatMsg));
            displayMessage(currentUsername, content, 'sent');
            messageInput.value = '';
        }
    }

    function displayMessage(sender, content, type) {
        const div = document.createElement('div');
        div.classList.add('message-bubble', type);
        div.innerHTML = `<strong>${sender}:</strong> ${content}`;
        messagesDisplay.appendChild(div);
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    }

    async function fetchContacts() {
        try {
            const res = await fetch(`${backendBaseUrl}/users/contacts?username=${currentUsername}`);
            const contacts = await res.json();
            contactListUl.innerHTML = '';
            contacts.forEach(contact => {
                const li = document.createElement('li');
                li.setAttribute('data-username', contact.username);
                li.innerHTML = `<span>${contact.username}</span><span class="contact-status ${contact.status === 'Online' ? 'status-online' : 'status-offline'}"></span>`;
                li.addEventListener('click', () => selectChatPartner(contact.username));
                contactListUl.appendChild(li);
            });
        } catch (e) { console.error('Error fetching contacts:', e); }
    }

    function selectChatPartner(partnerUsername) {
        currentChatPartner = partnerUsername;
        chatPartnerNameDisplay.textContent = partnerUsername;
        messagesDisplay.innerHTML = '';
        document.querySelectorAll('#contactList li').forEach(item => item.classList.remove('active'));
        document.querySelector(`li[data-username="${partnerUsername}"]`).classList.add('active');
        const statusSpan = document.querySelector(`li[data-username="${partnerUsername}"] .contact-status`);
        if (statusSpan) {
            chatPartnerStatusDisplay.textContent = statusSpan.classList.contains('status-online') ? 'Online' : 'Offline';
            chatPartnerStatusDisplay.className = statusSpan.classList.contains('status-online') ? 'status-online' : 'status-offline';
        }
    }

    if (!localStorage.getItem('loggedInUser')) {
        authContainer.classList.remove('hidden');
        chatContainer.classList.add('hidden');
    }
});