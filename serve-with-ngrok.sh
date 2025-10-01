#!/bin/bash

# Start ngrok for backend
echo "Starting ngrok for backend (4000)..."
ngrok http 4000 --log=stdout > ngrok_backend.log &
BACK_PID=$!

# Start ngrok for frontend
echo "Starting ngrok for frontend (3000)..."
ngrok http 3000 --log=stdout > ngrok_frontend.log &
FRONT_PID=$!

# Show dashboard
echo "Ngrok is running!"
echo "Check http://127.0.0.1:4040 for tunnel URLs"
echo "Press Ctrl+C to stop"

wait $BACK_PID $FRONT_PID
