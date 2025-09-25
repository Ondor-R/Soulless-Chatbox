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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // This is our "prompt engineering" part. We give the AI a role and the user's query.
        const prompt = `You are a helpful and knowledgeable expert for the video game "${gameContext}". Your primary goal is to provide accurate answers and useful resources.

        1.  First, answer the user's question directly and concisely.
        2.  If the user's question implies a need for a map, a guide, a walkthrough, or a specific item location, you **must** find and include a relevant link from a reputable source (like Fextralife, IGN, or other major game wikis).
        3.  Format all links using Markdown, for example: [High Wall of Lothric Map](https://darksouls3.wiki.fextralife.com/High+Wall+of+Lothric).
        4.  Arrange the answers so its easy to understand and look tidy inside the chatbox. 
        5.  Don't answer questions about game that isn't being selected or other things beside "${gameContext}".

        User's question: "${message}"`;

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