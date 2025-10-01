// update-frontend-env.js
import fs from "fs";
import fetch from "node-fetch";

async function updateEnv() {
    try {
        const res = await fetch("http://127.0.0.1:4040/api/tunnels");
        const data = await res.json();

        // Find backend tunnel (port 4000)
        const backendTunnel = data.tunnels.find(t => t.config.addr.includes("4000"));

        if (!backendTunnel) {
            console.error("❌ No backend ngrok tunnel found");
            process.exit(1);
        }

        const backendUrl = backendTunnel.public_url;
        console.log("✅ Found backend URL:", backendUrl);

        // Write to frontend/.env
        const envContent = `REACT_APP_API_BASE=${backendUrl}\n`;
        fs.writeFileSync("./frontend/.env", envContent);

        console.log("✅ frontend/.env updated with backend URL");
    } catch (err) {
        console.error("❌ Failed to update env:", err.message);
        process.exit(1);
    }
}

updateEnv();
