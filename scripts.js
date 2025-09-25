// =================================================================
// Slider Logic (with one key addition)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const sliderTrack = document.querySelector('.slider-track');
    if (!sliderTrack) return;

    const cards = Array.from(sliderTrack.children);
    const nextButton = document.getElementById('nextBtn');
    const prevButton = document.getElementById('prevBtn');
    
    if (cards.length === 0 || !nextButton || !prevButton) return;

    let currentIndex = 0;

    function updateSlider() {
        const sliderContainer = document.querySelector('.slider-container');
        const containerWidth = sliderContainer.offsetWidth;
        const cardWidth = cards[0].offsetWidth;
        const slideGap = parseFloat(getComputedStyle(sliderTrack).gap);
        
        const currentCardCenter = (currentIndex * (cardWidth + slideGap)) + (cardWidth / 2);
        const containerCenter = containerWidth / 2;
        const newTransformX = containerCenter - currentCardCenter;
        
        sliderTrack.style.transform = `translateX(${newTransformX}px)`;

        cards.forEach((card, index) => {
            card.classList.toggle('current-image', index === currentIndex);
        });

        // *** NEW PART: Update the game context for the chatbox ***
        const currentCard = cards[currentIndex];
        const gameName = currentCard.dataset.game; // Get game name from data-attribute
        setGameContext(gameName); // Update the chat context

        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === cards.length - 1;
    }

    nextButton.addEventListener('click', () => {
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            updateSlider();
        }
    });

    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    });

    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            currentIndex = index;
            updateSlider();
        });
    });

    updateSlider();
    window.addEventListener('resize', updateSlider);
});


// =================================================================
// Chatbox Logic (Completely Overhauled for AI)
// =================================================================
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
let currentGameContext = 'a video game'; // Default context

// Function to update the current game context
function setGameContext(gameName) {
    currentGameContext = gameName;
    const botMessage = `Hello! I'm now an expert on ${gameName}. Ask me anything!`;
    // Clear chat and add new context message, or just update a status.
    // For simplicity, let's just update the context variable silently.
    console.log(`Chat context set to: ${currentGameContext}`);
}

// Function to add a message to the chatbox
function addMessage(text, className) {
    // Remove any "typing" indicator first
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    messageElement.innerHTML = marked.parse(text);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Show a "typing..." indicator for better UX
function showTypingIndicator() {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message', 'typing-indicator');
    messageElement.textContent = '...';
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}


// Listen for the form submission
chatForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const userMessage = userInput.value.trim();

    if (userMessage === '') return;

    // 1. Add user's message to the UI immediately
    addMessage(userMessage, 'user-message');
    userInput.value = '';
    showTypingIndicator();

    try {
        // 2. Send the message and context to our secure serverless function
        const response = await fetch('/.netlify/functions/getAiResponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessage,
                context: currentGameContext
            })
        });

        if (!response.ok) {
            throw new Error(`AI server responded with status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.response;

        // 3. Add the AI's response to the UI
        addMessage(aiResponse, 'bot-message');

    } catch (error) {
        console.error("Error getting AI response:", error);
        addMessage("Sorry, I'm having trouble connecting to the AI right now.", 'bot-message');
    }
});