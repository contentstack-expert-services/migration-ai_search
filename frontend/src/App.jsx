import React, { useEffect, useRef, useState } from "react";
import ChatBox from "./ChatBox";
import { getSuggestedQuestions } from "./api";

function App() {
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSuggestedQuestions();
        setSuggestedQuestions(data.questions || []);
      } catch (err) {
        console.error("❌ Failed to fetch suggested questions:", err);
      }
    })();
  }, []);

  const handleSuggestionClick = (q, idx) => {
    setActiveIdx(idx);
    chatRef.current?.ask(q); // call ChatBox directly
  };

  return (
    <div className="min-h-screen flex font-sans bg-gradient-to-r from-gray-50 via-white to-gray-100">
      {/* MAIN (center) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border h-[90vh]">
          <header className="px-6 py-4 border-b bg-gray-50 text-center">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              📚 AI Search
            </h1>
            <p className="text-gray-500 mt-1">
              Ask questions about your documents and get instant answers
            </p>
          </header>

          <div className="flex-1 p-6 overflow-y-auto">
            {/* Expose ask() via ref */}
            <ChatBox ref={chatRef} />
          </div>
        </div>
      </main>

      {/* SIDEBAR (right) */}
      <aside className="w-1/4 bg-white shadow-lg border-l p-6 overflow-y-auto h-screen">
        <h2 className="text-xl font-bold mb-4 text-indigo-600">
          Suggested Questions
        </h2>
        <div className="space-y-3">
          {suggestedQuestions.length > 0 ? (
            suggestedQuestions.map((q, idx) => {
              const isActive = activeIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(q, idx)}
                  className={
                    "w-full text-left px-4 py-3 rounded-lg transition duration-200 shadow-sm " +
                    (isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 hover:bg-indigo-100 text-gray-700")
                  }
                  title={q}
                >
                  {q}
                </button>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">
              No suggested questions available
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
