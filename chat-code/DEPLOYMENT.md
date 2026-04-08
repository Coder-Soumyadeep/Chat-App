# Chat App Run and Deploy Guide

## Architecture

- `frontend`: Next.js app on port `3000`
- `backend/user`: auth and user service on port `5000`
- `backend/mail`: OTP mail worker on port `5001`
- `backend/chat`: chat and socket service on port `5002`

This app also depends on:

- MongoDB
- Redis
- RabbitMQ
- Cloudinary
- SMTP credentials for OTP emails

## Local Run

1. In `frontend`, create `.env.local` from `.env.local.example`.
2. In each backend, create `.env` from `.env.example` and fill in the real values.
3. Start the support services you use locally:
   - MongoDB
   - Redis
   - RabbitMQ
4. Run each app in a separate terminal:

```bash
cd backend/user && npm run build && npm start
cd backend/mail && npm run build && npm start
cd backend/chat && npm run build && npm start
cd frontend && npm run build && npm start
```

For development mode:

```bash
cd backend/user && npm run dev
cd backend/mail && npm run dev
cd backend/chat && npm run dev
cd frontend && npm run dev
```

## Recommended Deployment

Use two platforms:

- Vercel for `frontend`
- Railway or Render for `backend/user`, `backend/mail`, and `backend/chat`

This split is the simplest because the backend services are long-running Node processes and `backend/chat` uses Socket.IO.

## Environment Variables

### Frontend

```bash
NEXT_PUBLIC_USER_SERVICE_URL=https://your-user-service-url
NEXT_PUBLIC_CHAT_SERVICE_URL=https://your-chat-service-url
```

### User Service

```bash
MONGO_URI=...
PORT=5000
REDIS_URL=...
Rabbitmq_Host=...
Rabbitmq_Username=...
Rabbitmq_Password=...
JWT_SECRET=...
CLIENT_URL=https://your-frontend-url
```

### Chat Service

```bash
PORT=5002
MONGO_URI=...
JWT_SECRET=...
USER_SERVICE=https://your-user-service-url
Cloud_Name=...
Api_Key=...
Api_Secret=...
CLIENT_URL=https://your-frontend-url
```

### Mail Service

```bash
PORT=5001
Rabbitmq_Host=...
Rabbitmq_Username=...
Rabbitmq_Password=...
USER=...
PASSWORD=...
```

## Vercel Deployment

Deploy the `frontend` folder as a Next.js project and set:

```bash
NEXT_PUBLIC_USER_SERVICE_URL=https://your-user-service-url
NEXT_PUBLIC_CHAT_SERVICE_URL=https://your-chat-service-url
```

## Backend Deployment

Create three separate Node services:

- `backend/user`
  - build command: `npm run build`
  - start command: `npm start`
- `backend/mail`
  - build command: `npm run build`
  - start command: `npm start`
- `backend/chat`
  - build command: `npm run build`
  - start command: `npm start`

For `backend/chat`, make sure the platform supports WebSockets.
