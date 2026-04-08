module.exports = {
  apps: [
    {
      name: "chatapp-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "chatapp-user",
      cwd: "./backend/user",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "chatapp-chat",
      cwd: "./backend/chat",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "chatapp-mail",
      cwd: "./backend/mail",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
