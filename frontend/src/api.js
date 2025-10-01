// src/api.js
import API_BASE_URL from "./config";

// --- Ask a Question ---
export async function askQuestion(question) {
    const res = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        cache: "no-store",
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
}


// --- Get Suggested Questions ---
export async function getSuggestedQuestions() {
    const res = await fetch(`${API_BASE_URL}/suggested`, {
        method: "GET",
        cache: "no-store",
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
}

