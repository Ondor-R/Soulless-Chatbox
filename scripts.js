// =================================================================
// Slider Logic (with one key addition)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const sliderTrack = document.querySelector('.slider-track');
    if (!sliderTrack) return;

    const deleteChatBtn = document.getElementById('delete-chat-btn');

    // Add this event listener for the delete button
    deleteChatBtn.addEventListener('click', () => {
        // Ask for confirmation before deleting
        if (confirm("Are you sure you want to delete this chat history?")) {
            localStorage.removeItem('chatHistory');
            location.reload(); // Reload the page to reset the chat
        }
    });

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
// This array will hold the entire conversation
let chatHistory = [];
let currentGameContext = 'a video game'; // Default context

// --- Function to SAVE chat history to localStorage ---
function saveChatHistory() {
    // localStorage can only store strings, so we convert our array to a JSON string
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// --- Function to LOAD chat history from localStorage ---
function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    
    if (savedHistory) {
        // If history exists, convert it back from a string to an array
        chatHistory = JSON.parse(savedHistory);
        // Display each message from the loaded history
        chatHistory.forEach(message => {
            // We pass false to prevent re-saving what we just loaded
            addMessage(message.text, message.role, false); 
        });
    } else {
        // If no history, add the initial bot message
        const initialBotMessage = 'Hark, weary traveler. What troubles thy soul, that thou wouldst seek counsel from one such as I?';
        addMessage(initialBotMessage, 'bot-message');
    }
}

// Function to update the current game context
function setGameContext(gameName) {
    if (!gameName) {
        currentGameContext = 'video games in general';
    } else {
        currentGameContext = gameName;
    }
    console.log(`Chat context set to: ${currentGameContext}`);
}

/**
 * A function to add a new message to the chatbox.
 * @param {string} text - The text of the message.
 * @param {string} className - The CSS class for the message ('user-message' or 'bot-message').
 * @param {boolean} save - Whether to save the message to history. Defaults to true.
 */
function addMessage(text, className, save = true) {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    messageElement.innerHTML = marked.parse(text); 
    
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Add the message to our history array and save it
    if (save) {
        chatHistory.push({ role: className, text: text });
        saveChatHistory();
    }
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

    // Add user's message to the UI
    addMessage(userMessage, 'user-message');
    userInput.value = '';
    showTypingIndicator();

    try {
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

        // Add the AI's response to the UI
        addMessage(aiResponse, 'bot-message');

    } catch (error) {
        console.error("Error getting AI response:", error);
        addMessage("Sorry, I'm having trouble connecting to the AI right now.", 'bot-message');
    }
});

// --- Load the chat history when the page loads ---
// We need to wait for the slider logic to set the initial game context
document.addEventListener('DOMContentLoaded', () => {
    // A small delay to ensure the slider's initial context is set
    setTimeout(loadChatHistory, 100); 
});