# AWS EC2 Deployment Guide

This is the easiest deployment path for the current architecture.

## What runs on EC2

- `frontend` on port `3000`
- `backend/user` on port `5003`
- `backend/chat` on port `5002`
- `backend/mail` on port `5001`
- `nginx` as reverse proxy
- `pm2` to keep all services alive

## Recommended DNS layout

- `your-domain.com` -> frontend
- `api.your-domain.com` -> user service
- `socket.your-domain.com` -> chat service

## 1. Create the EC2 instance

- Launch Ubuntu 24.04 or Ubuntu 22.04
- Open inbound ports `22`, `80`, and `443`
- SSH into the server

## 2. Install system dependencies

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 3. Clone the project

```bash
git clone <your-repo-url> chat-code
cd chat-code
```

## 4. Install dependencies

```bash
cd frontend && npm install && cd ..
cd backend/user && npm install && cd ../..
cd backend/chat && npm install && cd ../..
cd backend/mail && npm install && cd ../..
```

## 5. Create production env files

Copy these files and fill the real values:

- `frontend/.env.production.example` -> `frontend/.env.production`
- `backend/user/.env.production.example` -> `backend/user/.env`
- `backend/chat/.env.production.example` -> `backend/chat/.env`
- `backend/mail/.env.production.example` -> `backend/mail/.env`

Important values:

- frontend `NEXT_PUBLIC_USER_SERVICE_URL=https://api.your-domain.com`
- frontend `NEXT_PUBLIC_CHAT_SERVICE_URL=https://socket.your-domain.com`
- user service `CLIENT_URL=https://your-domain.com`
- chat service `CLIENT_URL=https://your-domain.com`
- chat service `USER_SERVICE=http://127.0.0.1:5003`

## 6. Build the apps

```bash
cd frontend && npm run build && cd ..
cd backend/user && npm run build && cd ../..
cd backend/chat && npm run build && cd ../..
cd backend/mail && npm run build && cd ../..
```

## 7. Start everything with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Useful commands:

```bash
pm2 status
pm2 logs
pm2 restart ecosystem.config.cjs
```

## 8. Configure Nginx

Use `deploy/nginx/chatapp.conf.example` as your starting point.

Copy it into nginx:

```bash
sudo cp deploy/nginx/chatapp.conf.example /etc/nginx/sites-available/chatapp.conf
sudo ln -s /etc/nginx/sites-available/chatapp.conf /etc/nginx/sites-enabled/chatapp.conf
sudo nginx -t
sudo systemctl restart nginx
```

## 9. Add HTTPS

After DNS is pointing to the EC2 instance:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx
```

## 10. Notes

- The mail worker does not need a public domain
- The chat service must stay reachable through nginx with websocket upgrade headers
- MongoDB Atlas can stay external
- Redis and RabbitMQ can stay external or move to AWS later

## Suggested AWS upgrades later

- Replace Gmail SMTP with Amazon SES
- Replace RabbitMQ with SQS or Amazon MQ
- Replace Redis with ElastiCache
- Move from single EC2 to ECS when you want more production maturity
