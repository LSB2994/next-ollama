"use client";
import { useState } from "react";

export default function ChatApp() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    setIsLoading(true); // Show loading state

    try {
      const response = await fetch(
        `http://172.27.184.67:8080/chat?m=${encodeURIComponent(input)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      let botMessage = "No response from bot";

      console.log("Content-Type:", contentType); // Debugging
      const rawResponse = await response.text(); // Get raw text first
      console.log("Raw Response:", rawResponse); // Debugging

      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(rawResponse); // Parse as JSON
          // Check if the parsed data has a 'reply' field or similar
          botMessage = data.reply || data.message || JSON.stringify(data);
        } catch {
          // If JSON parsing fails, assume the raw response is plain text
          botMessage = rawResponse;
          console.warn(
            "Warning: Server returned invalid JSON but claimed application/json. Treating as plain text."
          );
        }
      } else if (contentType && contentType.includes("text/plain")) {
        botMessage = rawResponse; // Use plain text directly
      } else {
        botMessage = "Unexpected response format.";
      }

      setMessages((prev) => [...prev, { role: "bot", content: botMessage }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Error: Unable to fetch response." },
      ]);
    } finally {
      setIsLoading(false); // Hide loading state when done
    }
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 bg-gradient-to-b from-indigo-100 to-indigo-300">
      <div className="flex-1 overflow-auto p-4 border rounded-lg bg-white shadow-lg">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 p-3 rounded-lg ${
              msg.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-900"
            }`}
          >
            <strong className="block font-semibold">
              {msg.role === "user" ? "You" : "Bot"}:
            </strong>
            <p className="mt-1">{msg.content}</p>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center justify-start mt-4">
            <div className="w-3 h-3 mr-2 border-4 border-t-4 border-gray-500 rounded-full animate-spin"></div>
            <span className="text-gray-600">Bot is typing...</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-3 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={sendMessage}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg ml-4 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}
