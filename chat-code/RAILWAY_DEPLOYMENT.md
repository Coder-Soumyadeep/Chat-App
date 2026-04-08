# Railway Deployment Guide

This is the easiest way to deploy the current app without refactoring the architecture.

## Recommended Railway project layout

Create one Railway project with these 4 services:

1. `frontend`
2. `user-service`
3. `chat-service`
4. `mail-worker`

You can keep MongoDB Atlas as-is.

If you do not want to manage Redis and RabbitMQ yourself, add:

5. `redis`
6. `rabbitmq`

## Why Railway works well here

- Persistent Node services are supported
- Socket.IO works better here than on Vercel for this architecture
- Background worker processes fit naturally
- Monorepo root directories are supported

Reference:

- Monorepo support: https://docs.railway.com/guides/monorepo
- Build/start commands: https://docs.railway.com/reference/build-and-start-commands
- Services: https://docs.railway.com/reference/services

## Service setup

For each service:

- Connect the same GitHub repo
- Set the correct **Root Directory**
- Set the **Build Command**
- Set the **Start Command**

### 1. Frontend

- Root Directory: `/frontend`
- Build Command: `npm run build`
- Start Command: `npm start`

Environment variables:

```bash
NEXT_PUBLIC_USER_SERVICE_URL=https://<user-service-domain>
NEXT_PUBLIC_CHAT_SERVICE_URL=https://<chat-service-domain>
```

### 2. User Service

- Root Directory: `/backend/user`
- Build Command: `npm run build`
- Start Command: `npm start`

Environment variables:

```bash
MONGO_URI=...
PORT=5003
REDIS_URL=...
Rabbitmq_Host=...
Rabbitmq_Username=...
Rabbitmq_Password=...
JWT_SECRET=...
CLIENT_URL=https://<frontend-domain>
```

### 3. Chat Service

- Root Directory: `/backend/chat`
- Build Command: `npm run build`
- Start Command: `npm start`

Environment variables:

```bash
PORT=5002
MONGO_URI=...
JWT_SECRET=...
USER_SERVICE=https://<user-service-domain>
CLIENT_URL=https://<frontend-domain>
```

Important:

- `JWT_SECRET` must exactly match the user service
- `USER_SERVICE` must point to the deployed Railway URL of `user-service`

### 4. Mail Worker

- Root Directory: `/backend/mail`
- Build Command: `npm run build`
- Start Command: `npm start`

Environment variables:

```bash
PORT=5001
Rabbitmq_Host=...
Rabbitmq_Username=...
Rabbitmq_Password=...
MAIL_USER=...
MAIL_PASSWORD=...
```

## Redis and RabbitMQ

If you deploy Redis and RabbitMQ in Railway:

- Use Railway’s service URLs/hostnames in:
  - `REDIS_URL`
  - `Rabbitmq_Host`
  - `Rabbitmq_Username`
  - `Rabbitmq_Password`

If you already have external Redis/RabbitMQ, use those values instead.

## Deployment order

Deploy in this order:

1. `user-service`
2. `chat-service`
3. `mail-worker`
4. `frontend`

This makes it easier to plug the frontend env vars into already-running backend domains.

## After deployment

Test these flows:

1. Login with OTP
2. Create a chat by searching email/username
3. Send image/file
4. Voice call
5. Video call
6. Group call

## Important production note

Group/voice/video calling currently uses public STUN only. That is okay for testing and some users, but for stronger real-world reliability you will later want a TURN service.
