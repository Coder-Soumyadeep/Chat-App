import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin:
      allowedOrigins.length > 0
        ? allowedOrigins
        : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap: Record<string, string> = {};
type CallType = "voice" | "video";

interface ActiveCall {
  roomId: string;
  callType: CallType;
  callerId: string;
  chatId?: string;
  isGroup: boolean;
  participants: Set<string>;
  invitedUsers: Set<string>;
}

const activeCalls = new Map<string, ActiveCall>();

export const getRecieverSocketId = (recieverId: string): string | undefined => {
  return userSocketMap[recieverId];
};

io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  const userId = socket.handshake.query.userId as string | undefined;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  }

  io.emit("getOnlineUser", Object.keys(userSocketMap));

  if (userId) {
    socket.join(userId);
  }

  socket.on("call:start", (data) => {
    if (!userId || !Array.isArray(data?.participantIds)) return;

    const roomId = data.roomId as string;
    const participantIds = data.participantIds.filter(
      (participantId: string) => participantId && participantId !== userId
    );
    const reachableParticipantIds = participantIds.filter(
      (participantId: string) => Boolean(userSocketMap[participantId])
    );

    const activeCall: ActiveCall = {
      roomId,
      callType: data.callType === "video" ? "video" : "voice",
      callerId: userId,
      chatId: data.chatId,
      isGroup: Boolean(data.isGroup),
      participants: new Set([userId]),
      invitedUsers: new Set(participantIds),
    };

    activeCalls.set(roomId, activeCall);
    socket.join(roomId);

    participantIds.forEach((participantId: string) => {
      io.to(participantId).emit("call:incoming", {
        roomId,
        chatId: data.chatId,
        callType: activeCall.callType,
        callerId: userId,
        callerName: data.callerName,
        isGroup: activeCall.isGroup,
        participantIds: [userId, ...participantIds],
      });
    });

    socket.emit("call:started", {
      roomId,
      participantIds,
      reachableParticipantIds,
      callType: activeCall.callType,
      isGroup: activeCall.isGroup,
    });
  });

  socket.on("call:accept", (data) => {
    if (!userId) return;

    const roomId = data?.roomId as string;
    const activeCall = activeCalls.get(roomId);
    if (!activeCall) return;

    const existingParticipants = [...activeCall.participants].filter(
      (participantId) => participantId !== userId
    );

    activeCall.participants.add(userId);
    activeCall.invitedUsers.delete(userId);
    socket.join(roomId);

    socket.emit("call:participants", {
      roomId,
      participantIds: existingParticipants,
      callType: activeCall.callType,
      isGroup: activeCall.isGroup,
    });

    socket.to(roomId).emit("call:participant-joined", {
      roomId,
      userId,
    });
  });

  socket.on("call:reject", (data) => {
    if (!userId) return;

    const roomId = data?.roomId as string;
    const activeCall = activeCalls.get(roomId);
    if (!activeCall) return;

    activeCall.invitedUsers.delete(userId);

    io.to(activeCall.callerId).emit("call:rejected", {
      roomId,
      userId,
    });

    if (activeCall.participants.size === 0 && activeCall.invitedUsers.size === 0) {
      activeCalls.delete(roomId);
    }
  });

  socket.on("call:offer", (data) => {
    if (!userId || !data?.targetUserId) return;

    io.to(data.targetUserId).emit("call:offer", {
      roomId: data.roomId,
      fromUserId: userId,
      sdp: data.sdp,
    });
  });

  socket.on("call:answer", (data) => {
    if (!userId || !data?.targetUserId) return;

    io.to(data.targetUserId).emit("call:answer", {
      roomId: data.roomId,
      fromUserId: userId,
      sdp: data.sdp,
    });
  });

  socket.on("call:ice-candidate", (data) => {
    if (!userId || !data?.targetUserId) return;

    io.to(data.targetUserId).emit("call:ice-candidate", {
      roomId: data.roomId,
      fromUserId: userId,
      candidate: data.candidate,
    });
  });

  socket.on("call:end", (data) => {
    if (!userId) return;

    const roomId = data?.roomId as string;
    const activeCall = activeCalls.get(roomId);
    if (!activeCall) return;

    const recipients = new Set([
      ...activeCall.participants,
      ...activeCall.invitedUsers,
    ]);

    recipients.forEach((recipientId) => {
      io.to(recipientId).emit("call:ended", {
        roomId,
        endedBy: userId,
      });
    });

    activeCalls.delete(roomId);
  });

  socket.on("typing", (data) => {
    console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("stopTyping", (data) => {
    console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit("userStoppedTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat room ${chatId}`);
  });

  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${userId} left chat room ${chatId}`);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    if (userId) {
      delete userSocketMap[userId];
      console.log(`User ${userId} removed from online users`);
      io.emit("getOnlineUser", Object.keys(userSocketMap));

      activeCalls.forEach((activeCall, roomId) => {
        let changed = false;

        if (activeCall.participants.delete(userId)) {
          changed = true;
          socket.to(roomId).emit("call:participant-left", {
            roomId,
            userId,
          });
        }

        if (activeCall.invitedUsers.delete(userId)) {
          changed = true;
        }

        if (changed && activeCall.participants.size === 0) {
          activeCalls.delete(roomId);
        }
      });
    }
  });

  socket.on("connect_error", (error) => {
    console.log("Socket connection Error", error);
  });
});

export { app, server, io };
