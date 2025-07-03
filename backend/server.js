// backend/server.js
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch"); // For making HTTP requests to external APIs
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const port = 3001;

// --- Configuration ---
// Supabase credentials loaded from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Gemini API Key loaded from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;

// Mock Banking API URL loaded from environment variables
const mockBankingApiUrl = process.env.MOCK_BANKING_API_URL;

// Initialize Supabase client
let supabase;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Supabase client initialized.");
} else {
  console.error(
    "Supabase URL or Anon Key is missing. Please check your environment variables."
  );
  // Exit or handle gracefully if Supabase is critical
}

// --- Middleware ---
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// --- Helper function to call the LLM (Gemini API) ---
async function callGeminiLLM(chatHistory) {
  if (!geminiApiKey) {
    console.error("Gemini API Key is not set.");
    return { error: "Gemini API Key is not configured." };
  }

  const payload = {
    contents: chatHistory,
    generationConfig: {
      // You can adjust temperature, topK, topP as needed
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    },
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      return { error: `LLM API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    // Extract the text from the LLM response
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      return { text: result.candidates[0].content.parts[0].text };
    } else {
      console.warn(
        "Gemini API response structure unexpected:",
        JSON.stringify(result, null, 2)
      );
      return { error: "LLM did not return a valid text response." };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { error: `Failed to connect to LLM: ${error.message}` };
  }
}

// --- Helper function to interact with Mock Banking API ---
async function callMockBankingAPI(endpoint) {
  if (!mockBankingApiUrl) {
    console.error("Mock Banking API URL is not set.");
    return { error: "Mock Banking API URL is not configured." };
  }
  const url = `${mockBankingApiUrl}${endpoint}`;
  try {
    console.log(`[Backend] Calling Mock Banking API: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Mock Banking API error: ${response.status} - ${errorText}`
      );
      return { error: `Banking API error: ${response.status} - ${errorText}` };
    }
    return await response.json();
  } catch (error) {
    console.error("Error calling Mock Banking API:", error);
    return { error: `Failed to connect to Banking API: ${error.message}` };
  }
}

// --- Chat Endpoint ---
app.post("/chat", async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "User ID and message are required." });
  }

  if (!supabase) {
    return res.status(500).json({ error: "Supabase client not initialized." });
  }

  try {
    // 1. Store user message in Supabase chat history
    const { error: insertError } = await supabase
      .from("chat_history")
      .insert({ user_id: userId, role: "user", message: message });

    if (insertError) {
      console.error("Error saving user message to Supabase:", insertError);
      // Continue processing, but log the error
    }

    // 2. Retrieve previous chat history for context
    const { data: history, error: fetchError } = await supabase
      .from("chat_history")
      .select("role, message")
      .order("timestamp", { ascending: true })
      .limit(10); // Limit context to last 10 messages for brevity

    if (fetchError) {
      console.error("Error fetching chat history from Supabase:", fetchError);
      // Continue processing, but log the error
    }

    // Prepare chat history for LLM, including the current user message
    let chatHistoryForLLM = [];
    if (history) {
      chatHistoryForLLM = history.map((entry) => ({
        role: entry.role === "user" ? "user" : "model", // Gemini API expects 'user' or 'model'
        parts: [{ text: entry.message }],
      }));
    }
    // Add the current user message to the history for the LLM call
    chatHistoryForLLM.push({ role: "user", parts: [{ text: message }] });

    // 3. Determine if the query is a banking query and call mock API
    let llmResponseText = "";
    let bankingResponse = null;
    const lowerCaseMessage = message.toLowerCase();

    // Simple keyword-based intent detection for demo purposes
    const accountIdMatch = lowerCaseMessage.match(/\b(\d{5})\b/); // Matches 5-digit numbers
    const accountId = accountIdMatch ? accountIdMatch[1] : "12345"; // Default account

    if (
      lowerCaseMessage.includes("balance") ||
      lowerCaseMessage.includes("money")
    ) {
      bankingResponse = await callMockBankingAPI(
        `/account-balance/${accountId}`
      );
      if (bankingResponse && bankingResponse.status === "success") {
        llmResponseText = `Your account ${accountId} balance is: ${bankingResponse.data.balance} ${bankingResponse.data.currency}.`;
      } else {
        llmResponseText = `I couldn't retrieve the account balance. ${
          bankingResponse?.message || "Please ensure the account ID is valid."
        }`;
      }
    } else if (
      lowerCaseMessage.includes("transaction") ||
      lowerCaseMessage.includes("history")
    ) {
      bankingResponse = await callMockBankingAPI(
        `/transaction-history/${accountId}`
      );
      if (
        bankingResponse &&
        bankingResponse.status === "success" &&
        bankingResponse.data.length > 0
      ) {
        const transactions = bankingResponse.data
          .map((t) => `${t.date}: ${t.description} (${t.amount} ${t.type})`)
          .join("\n");
        llmResponseText = `Here are your recent transactions for account ${accountId}:\n${transactions}`;
      } else {
        llmResponseText = `I couldn't retrieve transaction history. ${
          bankingResponse?.message ||
          "No transactions found or invalid account ID."
        }`;
      }
    } else if (
      lowerCaseMessage.includes("list available accounts") ||
      lowerCaseMessage.includes("all accounts") ||
      lowerCaseMessage.includes("my accounts")
    ) {
      // New intent: List all available mock accounts
      bankingResponse = await callMockBankingAPI("/accounts");
      if (
        bankingResponse &&
        bankingResponse.status === "success" &&
        bankingResponse.data.length > 0
      ) {
        const accountsList = bankingResponse.data
          .map(
            (acc) =>
              `${acc.accountName} (ID: ${acc.accountId}, Balance: ${acc.balance} ${acc.currency})`
          )
          .join("\n");
        llmResponseText = `Here are your available accounts:\n${accountsList}`;
      } else {
        llmResponseText = `I couldn't retrieve available accounts. ${
          bankingResponse?.message || "No accounts found."
        }`;
      }
    } else if (
      lowerCaseMessage.includes("account details") ||
      lowerCaseMessage.includes("account info")
    ) {
      // New intent: Get details for a specific account
      bankingResponse = await callMockBankingAPI(
        `/account-balance/${accountId}`
      ); // Reusing account-balance endpoint for details
      if (bankingResponse && bankingResponse.status === "success") {
        const account = bankingResponse.data;
        llmResponseText = `Details for account ${account.accountId}:\nName: ${account.accountName}\nBalance: ${account.balance} ${account.currency}\nType: ${account.type}`;
      } else {
        llmResponseText = `I couldn't find details for account ${accountId}. ${
          bankingResponse?.message || "Please provide a valid account ID."
        }`;
      }
    } else {
      // If not a banking query, send to LLM for general response
      const llmResult = await callGeminiLLM(chatHistoryForLLM);
      if (llmResult.error) {
        llmResponseText = `I apologize, but I'm having trouble understanding. ${llmResult.error}`;
      } else {
        llmResponseText = llmResult.text;
      }
    }

    // 4. Store AI response in Supabase chat history
    const { error: aiInsertError } = await supabase
      .from("chat_history")
      .insert({ user_id: userId, role: "ai", message: llmResponseText });

    if (aiInsertError) {
      console.error("Error saving AI message to Supabase:", aiInsertError);
      // Continue processing, but log the error
    }

    // 5. Send AI response back to frontend
    res.json({
      response: llmResponseText,
      bankingData: bankingResponse, // Optionally send banking data for frontend display/debug
    });
  } catch (error) {
    console.error("Unexpected error in /chat endpoint:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Backend API Gateway is healthy");
});

// Start the server
app.listen(port, () => {
  console.log(`Backend API Gateway listening at http://localhost:${port}`);
});
