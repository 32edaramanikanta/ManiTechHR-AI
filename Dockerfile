# Step 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app

# Accept the API key as a build argument
ARG GEMINI_API_KEY
# Write it to .env.local for Vite to use during build
RUN echo "VITE_GEMINI_API_KEY=$GEMINI_API_KEY" > .env.local

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve the app using Nginx
FROM nginx:alpine
# Copy the built files from the first step
COPY --from=build /app/dist /usr/share/nginx/html
# Copy our custom nginx settings
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
