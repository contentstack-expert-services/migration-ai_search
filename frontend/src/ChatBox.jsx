import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { askQuestion } from "./api";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const ChatBox = forwardRef(function ChatBox(_, ref) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I’m your AI assistant. Ask me anything about your documents.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question) {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askQuestion(question);
      const answer = res.answer || "⚠️ No answer received.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Failed to fetch answer." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Expose ask() to parent through ref
  useImperativeHandle(ref, () => ({
    ask: (q) => send(q),
  }));

  function handleSendClick() {
    send(input);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {messages.map((msg, idx) =>
          msg.role === "assistant" ? (
            <div
              key={idx}
              className="w-full max-w-3xl mx-auto bg-gray-50 p-5 rounded-xl shadow-sm prose prose-indigo"
            >
              <ReactMarkdown
                children={msg.text}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className="bg-gray-200 px-1 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              />
            </div>
          ) : (
            <div
              key={idx}
              className="px-4 py-3 rounded-2xl max-w-[75%] ml-auto bg-indigo-600 text-white shadow-md"
            >
              {msg.text}
            </div>
          )
        )}
        {loading && (
          <div className="w-full max-w-3xl mx-auto bg-gray-100 text-gray-500 p-4 rounded-xl">
            Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex border-t pt-4">
        <input
          type="text"
          className="flex-1 border rounded-l-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button
          onClick={handleSendClick}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-r-xl transition"
        >
          Send
        </button>
      </div>
    </div>
  );
});

export default ChatBox;
