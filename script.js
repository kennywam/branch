document.addEventListener('DOMContentLoaded', () => {
    const socket = io("http://localhost:3000", { transports: ["websocket"] });
    const userIdHeader = document.getElementById('userIdHeader');
    const messagesDiv = document.getElementById('messages');
    const responsesDiv = document.getElementById('responses');
    const userList = document.getElementById('userList');
    const responseBodyInput = document.getElementById('responseBody');
    const responseForm = document.getElementById('responseForm');
    const userMessagesMap = {};

    function addMessageToDOM(userId, messageBody) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'userMessage');
        messageElement.innerHTML = `<span class="userId">${userId}:</span> ${messageBody}`;
        messagesDiv.appendChild(messageElement);
    }

    function addResponseToDOM(userId, responseBody) {
        const responseElement = document.createElement('div');
        responseElement.classList.add('message', 'responseMessage');
        responseElement.innerHTML = `<span class="userId">Agent:</span> ${responseBody}`;
        messagesDiv.appendChild(responseElement); 
    }
    function loadMessagesForUser(userId) {
        const messages = userMessagesMap[userId] || [];
        messagesDiv.innerHTML = ''; 

        messages.forEach(messageBody => {
            addMessageToDOM(userId, messageBody);
        });
    }

    function loadResponsesForUser(userId) {
        fetch(`http://localhost:3000/messages?userId=${userId}`)
            .then(response => response.json())
            .then(messages => {
                messages.forEach(message => {
                    const messageBody = message['Message Body'];
                    addResponseToDOM(userId, messageBody);
                });
            })
            .catch(error => console.error('Error fetching responses:', error));
    }

    function loadUserList() {
        fetch('http://localhost:3000/messages')
            .then(response => response.json())
            .then(messages => {
                messages.forEach(message => {
                    const userId = message['User ID'];
                    const messageBody = message['Message Body'];

                    if (!userMessagesMap[userId]) {
                        userMessagesMap[userId] = [];
                    }

                    userMessagesMap[userId].push(messageBody);

                    if (!document.getElementById(`userListItem${userId}`)) {
                        const listItem = document.createElement('li');
                        listItem.textContent = `User ID: ${userId}`;
                        listItem.id = `userListItem${userId}`;
                        listItem.addEventListener('click', () => {
                            userIdHeader.textContent = `User ID: ${userId}`;
                            loadMessagesForUser(userId);
                            loadResponsesForUser(userId);
                        });
                        userList.appendChild(listItem);
                    }
                });

                userList.style.height = '250px';
                userList.style.overflowY = 'scroll';
            })
            .catch(error => console.error('Error fetching messages:', error));
    }

    function sendResponse(userId, responseBody) {
        socket.emit('sendResponse', { userId, responseBody });
        responseBodyInput.value = '';
    }

    responseForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const responseBody = responseBodyInput.value;
        const userId = userIdHeader.textContent.split(' ')[2];
        sendResponse(userId, responseBody);
        addResponseToDOM(userId, responseBody);
    });

    socket.on('newMessage', ({ userId, messageBody }) => {
        addMessageToDOM(userId, messageBody);

        if (!userMessagesMap[userId]) {
            userMessagesMap[userId] = [];
        }

        userMessagesMap[userId].push(messageBody);
    });

    socket.on('setUserId', (userId) => {
        userIdHeader.textContent = `User ID: ${userId}`;
        loadMessagesForUser(userId);
        loadResponsesForUser(userId);
    });

    socket.on('sendResponse', async (data) => {
        const { userId, responseBody } = data;
        addResponseToDOM(userId, responseBody);

        if (!userMessagesMap[userId]) {
            userMessagesMap[userId] = [];
        }

        userMessagesMap[userId].push(responseBody);
    });

    socket.on('newResponse', ({ userId, messageBody }) => {
        addResponseToDOM(userId, messageBody);

        if (!userMessagesMap[userId]) {
            userMessagesMap[userId] = [];
        }

        userMessagesMap[userId].push(messageBody);
    });

    loadUserList();
});
