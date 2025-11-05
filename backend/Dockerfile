FROM node:20-alpine

# Install netcat for healthchecks and wait-for scripts
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 8081 2525

# Use entrypoint script that runs migrations automatically
ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
