FROM node:20-alpine

WORKDIR /app

# Terima build args
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_URL

# Set environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app (environment variables akan ke-bake di sini)
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
