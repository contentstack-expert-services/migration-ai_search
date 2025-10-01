# --- Build Stage ---
FROM node:18 AS build

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies (including Tailwind + PostCSS)
RUN npm install

# Copy the rest of the app
COPY . .

# Build the React app (Tailwind + PostCSS runs here)
RUN npm run build

# --- Serve Stage ---
FROM nginx:alpine

# Copy nginx config if you have custom routes
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
