document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // Global State and Element References
    // =================================================================
    let allChats = {}; // Object to hold all chat sessions
    let activeChatId = null; // ID of the currently active chat
    let currentGameContext = 'a video game'; // Default game context

    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatList = document.getElementById('chat-list');
    
    // Slider Elements
    const sliderTrack = document.querySelector('.slider-track');
    const nextButton = document.getElementById('nextBtn');
    const prevButton = document.getElementById('prevBtn');

    // =================================================================
    // Chat Management Functions
    // =================================================================
    
    function loadState() {
        const savedChats = localStorage.getItem('allChats');
        if (savedChats) {
            allChats = JSON.parse(savedChats);
        }
        activeChatId = localStorage.getItem('activeChatId');
    }

    function saveState() {
        localStorage.setItem('allChats', JSON.stringify(allChats));
        if (activeChatId) {
            localStorage.setItem('activeChatId', activeChatId);
        } else {
            localStorage.removeItem('activeChatId');
        }
    }

    function renderSidebar() {
        chatList.innerHTML = ''; // Clear the list first
        Object.values(allChats).forEach(chat => {
            const listItem = document.createElement('li');
            listItem.textContent = chat.title;
            listItem.dataset.id = chat.id;
            if (chat.id === activeChatId) {
                listItem.classList.add('active-chat');
            }
            chatList.appendChild(listItem);
        });
    }

    function displayChat(chatId) {
        chatBox.innerHTML = '';
        if (chatId && allChats[chatId]) {
            allChats[chatId].messages.forEach(message => {
                addMessageToDOM(message.text, message.role);
            });
        }
    }

    function switchChat(chatId) {
        activeChatId = chatId;
        displayChat(chatId);
        renderSidebar(); // Re-render to update the active highlight
        saveState();
    }
    
    function startNewChat() {
        activeChatId = null;
        chatBox.innerHTML = '';
        addMessageToDOM("Hark, weary traveler. What troubles thy soul, that thou wouldst seek counsel from one such as I?", 'bot-message');
        renderSidebar(); // Re-render to remove active highlight
        saveState();
    }

    // =================================================================
    // Message Handling
    // =================================================================

    function addMessageToDOM(text, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);
        if (typeof marked !== 'undefined') {
            messageElement.innerHTML = marked.parse(text);
        } else {
            messageElement.textContent = text;
        }
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('message', 'bot-message', 'typing-indicator');
        indicator.textContent = '...';
        chatBox.appendChild(indicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    chatForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const userMessageText = userInput.value.trim();
        if (userMessageText === '') return;

        let isNewChat = false;
        if (!activeChatId) {
            isNewChat = true;
            const newChatId = Date.now().toString();
            activeChatId = newChatId;
            allChats[newChatId] = {
                id: newChatId,
                title: userMessageText.substring(0, 30), // Use first 30 chars as title
                messages: [{ role: 'bot-message', text: "Hark, weary traveler. What troubles thy soul, that thou wouldst seek counsel from one such as I?" }]
            };
        }

        const userMessage = { role: 'user-message', text: userMessageText };
        allChats[activeChatId].messages.push(userMessage);
        
        if(isNewChat) {
             // If it's a new chat, we need to clear the welcome message and re-render
            displayChat(activeChatId);
        } else {
            addMessageToDOM(userMessage.text, userMessage.role);
        }

        userInput.value = '';
        renderSidebar();
        showTypingIndicator();
        saveState();

        try {
            const response = await fetch('/.netlify/functions/getAiResponse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessageText, context: currentGameContext })
            });
            if (!response.ok) throw new Error('AI server error');
            
            const data = await response.json();
            const aiMessage = { role: 'bot-message', text: data.response };
            
            const indicator = document.querySelector('.typing-indicator');
            if(indicator) indicator.remove();
            
            allChats[activeChatId].messages.push(aiMessage);
            addMessageToDOM(aiMessage.text, aiMessage.role);
            saveState();

        } catch (error) {
            console.error("Error getting AI response:", error);
            const indicator = document.querySelector('.typing-indicator');
            if(indicator) indicator.remove();
            addMessageToDOM("Sorry, I'm having trouble connecting to the AI.", 'bot-message');
        }
    });

    // =================================================================
    // Event Listeners & Slider Logic
    // =================================================================
    newChatBtn.addEventListener('click', startNewChat);

    chatList.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const chatId = event.target.dataset.id;
            if (chatId !== activeChatId) {
                switchChat(chatId);
            }
        }
    });

    let sliderIndex = 0;
    const cards = Array.from(sliderTrack.children);

    function updateSlider() {
        const containerWidth = sliderTrack.parentElement.offsetWidth;
        const cardWidth = cards[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(sliderTrack).gap);
        
        const offset = (containerWidth / 2) - (cardWidth / 2) - (sliderIndex * (cardWidth + gap));
        sliderTrack.style.transform = `translateX(${offset}px)`;

        cards.forEach((card, index) => {
            card.classList.toggle('current-image', index === sliderIndex);
        });
        
        currentGameContext = cards[sliderIndex].dataset.game || 'a video game';
        
        prevButton.disabled = sliderIndex === 0;
        nextButton.disabled = sliderIndex === cards.length - 1;
    }
    
    if (cards.length > 0) {
        nextButton.addEventListener('click', () => {
            if (sliderIndex < cards.length - 1) {
                sliderIndex++;
                updateSlider();
            }
        });

        prevButton.addEventListener('click', () => {
            if (sliderIndex > 0) {
                sliderIndex--;
                updateSlider();
            }
        });

        cards.forEach((card, index) => {
            card.addEventListener('click', () => {
                sliderIndex = index;
                updateSlider();
            });
        });
        updateSlider();
    }
     
    // =================================================================
    // Initial Application Load
    // =================================================================
    function initializeApp() {
        loadState();
        if (!activeChatId && Object.keys(allChats).length > 0) {
            activeChatId = Object.keys(allChats).sort().pop();
        }
        renderSidebar();
        if (activeChatId) {
            displayChat(activeChatId);
        } else {
            startNewChat();
        }
        window.addEventListener('resize', updateSlider);
    }
    
    initializeApp();
});