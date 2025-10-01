#!/bin/bash
echo "Rebuilding sharp for current platform..."
npm rebuild sharp --verbose
echo "Starting server..."
exec node server.js