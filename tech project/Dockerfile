# 1) Lightweight Node image
FROM node:18-alpine

# 2) App work directory inside the container
WORKDIR /app

# 3) Install dependencies first (better layer caching)
COPY package*.json ./
# Use npm ci if you commit package-lock.json; fallback to install otherwise
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --only=production; fi

# 4) Copy application source
COPY src ./src
COPY README.md ./README.md

# 5) Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# 6) Expose service port
EXPOSE 3000

# 7) Start the service
CMD ["npm", "start"]
