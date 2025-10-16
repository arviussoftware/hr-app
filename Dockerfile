# Use official Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies only
COPY package*.json ./
RUN npm ci

# Copy all source code
COPY . .

# Build the Next.js app for production
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Run the app in production mode
CMD ["npm", "start"]
