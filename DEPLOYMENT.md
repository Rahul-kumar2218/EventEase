# EventEase 2026 Production Deployment Guide

This guide details best practices for deploying the **EventEase** full-stack event management platform in production environments.

---

## 1. System Requirements & Architecture

- **Node.js:** v18.x LTS or v20.x+ LTS
- **MongoDB:** v6.0+ or MongoDB Atlas cluster (M10+ recommended for replica sets / atomic transactions)
- **Reverse Proxy:** Nginx, Caddy, or Cloudflare
- **Process Manager:** PM2 or Kubernetes / Docker
- **SSL/TLS:** Let's Encrypt / Certbot or Cloudflare Origin CA

```mermaid
graph TD
  User([Client / Browser / PWA]) -->|HTTPS:443| Nginx[Nginx Reverse Proxy]
  Nginx -->|Static Assets| ViteDist[Vite SPA Build /dist]
  Nginx -->|/api/* Proxy| NodeApp[Node.js Express Cluster (PM2)]
  NodeApp -->|Mongoose connection pool| MongoDb[(MongoDB Database)]
  NodeApp -.->|AI Generation| GeminiAPI[Google Gemini 2.5/Flash API]
  NodeApp -.->|Payments| Razorpay[Razorpay Gateway API]
```

---

## 2. Environment Variables Configuration

Create a production `.env` file in `server/`:

```bash
# Server configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://eventease.yourdomain.com

# High-entropy JWT & HMAC secret (minimum 32 characters)
JWT_SECRET=generate_with_openssl_rand_hex_64

# MongoDB Atlas or Replica Set Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/eventease?retryWrites=true&w=majority

# External Integrations (Optional)
GEMINI_API_KEY=AIzaSy...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_razorpay_secret...
```

---

## 3. Frontend Production Build

1. Set the API endpoint URL for the client in `client/.env.production`:
   ```bash
   VITE_API_BASE_URL=https://eventease.yourdomain.com/api
   ```
2. Build the optimized static assets:
   ```bash
   cd client
   npm install
   npm run build
   ```
3. Assets will be generated in `client/dist`.

---

## 4. Backend Deployment via PM2

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Create an `ecosystem.config.cjs` file in `server/`:
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'eventease-api',
         script: 'src/server.js',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 5000,
         },
         max_memory_restart: '500M',
         watch: false,
         time: true,
       },
     ],
   };
   ```
3. Start the application:
   ```bash
   cd server
   npm install --production
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

---

## 5. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/eventease`:

```nginx
server {
    listen 80;
    server_name eventease.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eventease.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/eventease.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eventease.yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(self)" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend Static Single Page Application
    root /var/www/eventease/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

---

## 6. Docker Containerization (Optional)

### Backend `server/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### Frontend `client/Dockerfile`:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 7. Database Backups & Index Verification

Ensure compound indexes are generated on deployment:
```bash
node -e "import('./server/src/models/Participant.js'); import('./server/src/models/CheckIn.js');"
```

Set up automated daily MongoDB backups using `mongodump`:
```bash
mongodump --uri="$MONGODB_URI" --gzip --archive=/backups/eventease_$(date +%Y%m%d).gz
```

