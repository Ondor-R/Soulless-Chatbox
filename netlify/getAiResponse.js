const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { message, context: gameContext } = JSON.parse(event.body);

        // For text-only input, use the gemini-pro model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // This is our "prompt engineering" part. We give the AI a role and the user's query.
        const prompt = `You are an expert assistant for the video game named "${gameContext}". Answer the user's question concisely and accurately. User's question: "${message}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ response: text }),
        };
    } catch (error) {
        console.error("Error in AI function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to get response from AI." }),
        };
    }
};