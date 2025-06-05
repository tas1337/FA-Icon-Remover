FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for nodemon)
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application (will be overridden by docker-compose)
CMD ["npm", "run", "dev"]