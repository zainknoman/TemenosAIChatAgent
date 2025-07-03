// Temporary comment for Docker cache invalidation
// frontend/src/App.js
import React, { useState, useEffect, useRef } from "react";
import "./index.css"; // Ensure Tailwind CSS is imported

// Main App component
function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const messagesEndRef = useRef(null);

  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  // Scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock Authentication Logic
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError("");
    // Simple mock authentication: any non-empty username/password works
    if (username && password) {
      // In a real app, you'd send these to a backend auth endpoint
      const generatedUserId = `user_${username
        .toLowerCase()
        .replace(/\s/g, "")}_${Date.now()}`;
      setUserId(generatedUserId);
      setIsAuthenticated(true);
      console.log(`User logged in: ${username}, User ID: ${generatedUserId}`);
    } else {
      setAuthError("Please enter both username and password.");
    }
  };

  // Send message to backend
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated) return;

    const userMessage = { role: "user", content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage("");

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, message: inputMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to get response from AI agent."
        );
      }

      const data = await response.json();
      const aiMessage = { role: "ai", content: data.response };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "ai", content: `Error: ${error.message}. Please try again.` },
      ]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Login to Chat
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Login
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600 text-sm">
            * For demo purposes, any non-empty username/password will work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 font-inter">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[80vh] md:h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-indigo-700 text-white rounded-t-xl shadow-md flex justify-between items-center">
          <h1 className="text-2xl font-bold">Temenos T24 AI Agent</h1>
          <span className="text-sm opacity-80">User ID: {userId}</span>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 italic mt-10">
              Start a conversation! Try asking: "What is my account balance?" or
              "Show me my transaction history."
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-md ${
                  msg.role === "user"
                    ? "bg-indigo-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>

        {/* Message Input */}
        <form
          onSubmit={sendMessage}
          className="p-5 border-t border-gray-200 bg-gray-50 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 text-base"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
