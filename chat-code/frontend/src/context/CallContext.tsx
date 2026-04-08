"use client";

import { User, useAppData } from "@/context/AppContext";
import { SocketData } from "@/context/SocketContext";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

type CallType = "voice" | "video";
type RingtonePresetId = "classic-bell" | "digital-pulse" | "soft-chime";

interface RingtonePreset {
  id: RingtonePresetId;
  name: string;
  description: string;
}

interface CustomRingtone {
  name: string;
  dataUrl: string;
}

interface CallParticipant {
  userId: string;
  name: string;
  stream: MediaStream | null;
}

interface IncomingCall {
  roomId: string;
  callType: CallType;
  callerId: string;
  callerName: string;
  isGroup: boolean;
  participantIds: string[];
}

interface CurrentCall {
  roomId: string;
  callType: CallType;
  isGroup: boolean;
  status: "calling" | "ringing" | "connecting" | "connected";
  participants: CallParticipant[];
}

interface CallContextType {
  currentCall: CurrentCall | null;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraEnabled: boolean;
  startDirectCall: (target: User, callType: CallType) => Promise<void>;
  startGroupCall: (targets: User[], callType: CallType) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  ringtonePresets: RingtonePreset[];
  selectedRingtone: string;
  customRingtone: CustomRingtone | null;
  setRingtonePreset: (presetId: RingtonePresetId) => void;
  useCustomRingtone: () => void;
  setCustomRingtone: (file: File) => Promise<void>;
  clearCustomRingtone: () => void;
  previewRingtone: (ringtoneId?: string) => Promise<void>;
  stopRingtonePreview: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

const ringtonePresets: RingtonePreset[] = [
  {
    id: "classic-bell",
    name: "Classic Bell",
    description: "Bright two-tone bell with a crisp rise.",
  },
  {
    id: "digital-pulse",
    name: "Digital Pulse",
    description: "Sharper synth pulse with a modern alert feel.",
  },
  {
    id: "soft-chime",
    name: "Soft Chime",
    description: "Gentle layered chime for calmer incoming calls.",
  },
];

const RINGTONE_STORAGE_KEY = "chat-ringtone-id";
const CUSTOM_RINGTONE_STORAGE_KEY = "chat-custom-ringtone";

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = SocketData();
  const { user, users } = useAppData();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [currentCall, setCurrentCall] = useState<CurrentCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [selectedRingtone, setSelectedRingtone] = useState<string>("classic-bell");
  const [customRingtone, setCustomRingtoneState] = useState<CustomRingtone | null>(
    null
  );

  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const currentCallRef = useRef<CurrentCall | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission | null>(null);

  useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const usersById = useMemo(() => {
    const entries = new Map<string, string>();
    if (user?._id) entries.set(user._id, user.name);
    users?.forEach((item) => entries.set(item._id, item.name));
    return entries;
  }, [user, users]);

  const getUserName = (userId: string, fallback = "Unknown user") =>
    usersById.get(userId) || fallback;

  const updateParticipant = (
    userId: string,
    updater: (participant: CallParticipant | undefined) => CallParticipant
  ) => {
    setCurrentCall((prev) => {
      if (!prev) return prev;
      const existing = prev.participants.find(
        (participant) => participant.userId === userId
      );
      const nextParticipant = updater(existing);
      const otherParticipants = prev.participants.filter(
        (participant) => participant.userId !== userId
      );

      return {
        ...prev,
        participants: [...otherParticipants, nextParticipant],
      };
    });
  };

  const clearCallState = () => {
    Object.values(peerConnectionsRef.current).forEach((connection) =>
      connection.close()
    );
    peerConnectionsRef.current = {};
    pendingCandidatesRef.current = {};
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setCurrentCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraEnabled(true);
  };

  const createRingtoneDataUri = (presetId: RingtonePresetId) => {
    const sampleRate = 22050;
    const duration = presetId === "soft-chime" ? 1.2 : 0.9;
    const frameCount = Math.floor(sampleRate * duration);
    const samples = new Int16Array(frameCount);

    for (let i = 0; i < frameCount; i += 1) {
      const time = i / sampleRate;
      let sample = 0;

      if (presetId === "classic-bell") {
        const envelope =
          time < 0.08
            ? time / 0.08
            : time < 0.5
            ? 1
            : Math.max(0, 1 - (time - 0.5) / 0.4);
        const toneA = Math.sin(2 * Math.PI * 740 * time);
        const toneB = Math.sin(2 * Math.PI * 880 * time);
        const gated = Math.sin(2 * Math.PI * 2 * time) > 0 ? 1 : 0.45;
        sample = (toneA * 0.55 + toneB * 0.45) * envelope * gated;
      } else if (presetId === "digital-pulse") {
        const envelope =
          time < 0.03
            ? time / 0.03
            : time < 0.24
            ? 1
            : Math.max(0, 1 - (time - 0.24) / 0.4);
        const pulse = Math.sign(Math.sin(2 * Math.PI * 620 * time));
        const sparkle = Math.sin(2 * Math.PI * 1240 * time) * 0.25;
        sample = (pulse * 0.7 + sparkle) * envelope;
      } else {
        const envelope =
          time < 0.12
            ? time / 0.12
            : time < 0.68
            ? 1
            : Math.max(0, 1 - (time - 0.68) / 0.42);
        const toneA = Math.sin(2 * Math.PI * 523.25 * time);
        const toneB = Math.sin(2 * Math.PI * 659.25 * time);
        const toneC = Math.sin(2 * Math.PI * 783.99 * time);
        sample = (toneA * 0.45 + toneB * 0.35 + toneC * 0.2) * envelope;
      }

      samples[i] = Math.max(-1, Math.min(1, sample)) * 32767;
    }

    const bytesPerSample = 2;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i += 1) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    samples.forEach((sample, index) => {
      view.setInt16(44 + index * bytesPerSample, sample, true);
    });

    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return `data:audio/wav;base64,${btoa(binary)}`;
  };

  const getRingtoneSource = (ringtoneId?: string) => {
    if (ringtoneId === "custom" && customRingtone?.dataUrl) {
      return customRingtone.dataUrl;
    }

    const presetId = (ringtoneId || selectedRingtone) as RingtonePresetId;
    return createRingtoneDataUri(presetId);
  };

  const ensureRingtoneAudio = (ringtoneId?: string) => {
    const src = getRingtoneSource(ringtoneId);

    if (!ringtoneAudioRef.current) {
      const audio = new Audio(src);
      audio.loop = true;
      audio.preload = "auto";
      ringtoneAudioRef.current = audio;
      return audio;
    }

    if (ringtoneAudioRef.current.src !== src) {
      ringtoneAudioRef.current.src = src;
    }

    return ringtoneAudioRef.current;
  };

  const stopRingtone = () => {
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
    }
  };

  const previewRingtone = async (ringtoneId?: string) => {
    stopRingtone();
    const audio = ensureRingtoneAudio(ringtoneId);
    audio.loop = false;

    try {
      await audio.play();
    } catch {
      toast("Incoming call");
    }
  };

  const startRingtone = () => {
    stopRingtone();
    const audio = ensureRingtoneAudio();
    audio.loop = true;
    audio.play().catch(() => {
      toast("Incoming call");
    });
  };

  const setRingtonePreset = (presetId: RingtonePresetId) => {
    setSelectedRingtone(presetId);
    window.localStorage.setItem(RINGTONE_STORAGE_KEY, presetId);
  };

  const setCustomRingtone = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      throw new Error("Please choose an audio file");
    }

    if (file.size > 1024 * 1024 * 2) {
      throw new Error("Custom ringtone must be smaller than 2MB");
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read ringtone file"));
      reader.readAsDataURL(file);
    });

    const nextCustomRingtone = {
      name: file.name,
      dataUrl,
    };

    setCustomRingtoneState(nextCustomRingtone);
    setSelectedRingtone("custom");
    window.localStorage.setItem(
      CUSTOM_RINGTONE_STORAGE_KEY,
      JSON.stringify(nextCustomRingtone)
    );
    window.localStorage.setItem(RINGTONE_STORAGE_KEY, "custom");
  };

  const useCustomRingtone = () => {
    if (!customRingtone) return;

    setSelectedRingtone("custom");
    window.localStorage.setItem(RINGTONE_STORAGE_KEY, "custom");
  };

  const clearCustomRingtone = () => {
    setCustomRingtoneState(null);
    window.localStorage.removeItem(CUSTOM_RINGTONE_STORAGE_KEY);

    if (selectedRingtone === "custom") {
      setSelectedRingtone("classic-bell");
      window.localStorage.setItem(RINGTONE_STORAGE_KEY, "classic-bell");
    }
  };

  const notifyIncomingCall = (data: IncomingCall) => {
    if (typeof window === "undefined") return;

    if (document.visibilityState === "visible") return;

    const showNotification = () => {
      new Notification(
        `${data.callerName} is calling`,
        {
          body: `${data.isGroup ? "Group" : "Private"} ${data.callType} call`,
          silent: false,
        }
      );
    };

    const permission = notificationPermissionRef.current;
    if (permission === "granted") {
      showNotification();
      return;
    }

    if (permission !== "denied") {
      Notification.requestPermission().then((nextPermission) => {
        notificationPermissionRef.current = nextPermission;
        if (nextPermission === "granted") {
          showNotification();
        }
      });
    }
  };

  const ensureLocalStream = async (callType: CallType) => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsMuted(false);
    setIsCameraEnabled(callType === "video");

    return stream;
  };

  const flushPendingCandidates = async (userId: string) => {
    const connection = peerConnectionsRef.current[userId];
    const pendingCandidates = pendingCandidatesRef.current[userId] || [];

    if (!connection || !connection.remoteDescription) return;

    for (const candidate of pendingCandidates) {
      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    }

    pendingCandidatesRef.current[userId] = [];
  };

  const createPeerConnection = async (remoteUserId: string, roomId: string) => {
    if (peerConnectionsRef.current[remoteUserId]) {
      return peerConnectionsRef.current[remoteUserId];
    }

    const stream = localStreamRef.current;
    if (!stream || !socket || !user) {
      throw new Error("Local stream or socket unavailable");
    }

    const peerConnection = new RTCPeerConnection(rtcConfig);

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", {
          roomId,
          targetUserId: remoteUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      updateParticipant(remoteUserId, (participant) => ({
        userId: remoteUserId,
        name: participant?.name || getUserName(remoteUserId),
        stream: remoteStream,
      }));

      setCurrentCall((prev) =>
        prev
          ? {
              ...prev,
              status: "connected",
            }
          : prev
      );
    };

    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed" ||
        peerConnection.connectionState === "disconnected"
      ) {
        peerConnection.close();
        delete peerConnectionsRef.current[remoteUserId];
      }
    };

    peerConnectionsRef.current[remoteUserId] = peerConnection;

    return peerConnection;
  };

  const createOfferForParticipant = async (roomId: string, remoteUserId: string) => {
    const peerConnection = await createPeerConnection(remoteUserId, roomId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket?.emit("call:offer", {
      roomId,
      targetUserId: remoteUserId,
      sdp: offer,
    });
  };

  const startCall = async (
    targets: User[],
    callType: CallType,
    isGroup: boolean
  ) => {
    if (!socket || !user || targets.length === 0) return;

    await ensureLocalStream(callType);

    const roomId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `call-${Date.now()}`;

    setCurrentCall({
      roomId,
      callType,
      isGroup,
      status: "calling",
      participants: targets.map((target) => ({
        userId: target._id,
        name: target.name,
        stream: null,
      })),
    });

    socket.emit("call:start", {
      roomId,
      participantIds: targets.map((target) => target._id),
      callType,
      isGroup,
      callerName: user.name,
    });
  };

  const startDirectCall = async (target: User, callType: CallType) => {
    await startCall([target], callType, false);
  };

  const startGroupCall = async (targets: User[], callType: CallType) => {
    await startCall(targets, callType, true);
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall || !socket) return;

    await ensureLocalStream(incomingCall.callType);

    setCurrentCall({
      roomId: incomingCall.roomId,
      callType: incomingCall.callType,
      isGroup: incomingCall.isGroup,
      status: "connecting",
      participants: incomingCall.participantIds
        .filter((participantId) => participantId !== user?._id)
        .map((participantId) => ({
          userId: participantId,
          name:
            participantId === incomingCall.callerId
              ? incomingCall.callerName
              : getUserName(participantId),
          stream: null,
        })),
    });

    socket.emit("call:accept", {
      roomId: incomingCall.roomId,
    });

    stopRingtone();
    setIncomingCall(null);
  };

  const rejectIncomingCall = () => {
    if (!incomingCall || !socket) return;

    socket.emit("call:reject", {
      roomId: incomingCall.roomId,
    });

    stopRingtone();
    setIncomingCall(null);
  };

  const endCall = () => {
    if (currentCallRef.current && socket) {
      socket.emit("call:end", {
        roomId: currentCallRef.current.roomId,
      });
    }

    clearCallState();
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const nextCameraEnabled = !isCameraEnabled;
    videoTracks.forEach((track) => {
      track.enabled = nextCameraEnabled;
    });
    setIsCameraEnabled(nextCameraEnabled);
  };

  useEffect(() => {
    if (!socket || !user) return;

    const onIncomingCall = (data: IncomingCall) => {
      if (currentCallRef.current) {
        socket.emit("call:reject", { roomId: data.roomId });
        return;
      }

      startRingtone();
      notifyIncomingCall(data);
      setIncomingCall(data);
    };

    const onParticipants = async (data: {
      roomId: string;
      participantIds: string[];
      reachableParticipantIds?: string[];
    }) => {
      setCurrentCall((prev) =>
        prev
          ? {
              ...prev,
              status:
                data.reachableParticipantIds &&
                data.reachableParticipantIds.length > 0
                  ? "ringing"
                  : "calling",
            }
          : prev
      );

      for (const participantId of data.participantIds) {
        await createOfferForParticipant(data.roomId, participantId);
      }
    };

    const onOffer = async (data: {
      roomId: string;
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const peerConnection = await createPeerConnection(
        data.fromUserId,
        data.roomId
      );

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      );
      await flushPendingCandidates(data.fromUserId);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("call:answer", {
        roomId: data.roomId,
        targetUserId: data.fromUserId,
        sdp: answer,
      });
    };

    const onAnswer = async (data: {
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const peerConnection = peerConnectionsRef.current[data.fromUserId];
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      );
      await flushPendingCandidates(data.fromUserId);
    };

    const onIceCandidate = async (data: {
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const peerConnection = peerConnectionsRef.current[data.fromUserId];
      if (!peerConnection || !peerConnection.remoteDescription) {
        pendingCandidatesRef.current[data.fromUserId] = [
          ...(pendingCandidatesRef.current[data.fromUserId] || []),
          data.candidate,
        ];
        return;
      }

      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    };

    const onParticipantJoined = (data: { userId: string }) => {
      updateParticipant(data.userId, (participant) => ({
        userId: data.userId,
        name: participant?.name || getUserName(data.userId),
        stream: participant?.stream || null,
      }));

      setCurrentCall((prev) =>
        prev
          ? {
              ...prev,
              status: "connecting",
            }
          : prev
      );
    };

    const onParticipantLeft = (data: { userId: string }) => {
      peerConnectionsRef.current[data.userId]?.close();
      delete peerConnectionsRef.current[data.userId];
      delete pendingCandidatesRef.current[data.userId];

      setCurrentCall((prev) =>
        prev
          ? {
              ...prev,
              participants: prev.participants.filter(
                (participant) => participant.userId !== data.userId
              ),
            }
          : prev
      );
    };

    const onRejected = (data: { userId: string }) => {
      toast.error(`${getUserName(data.userId)} declined the call`);
    };

    const onEnded = (data: { endedBy: string }) => {
      stopRingtone();
      if (data.endedBy !== user._id) {
        toast("Call ended");
      }
      clearCallState();
    };

    socket.on("call:incoming", onIncomingCall);
    socket.on("call:participants", onParticipants);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:participant-joined", onParticipantJoined);
    socket.on("call:participant-left", onParticipantLeft);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncomingCall);
      socket.off("call:participants", onParticipants);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:participant-joined", onParticipantJoined);
      socket.off("call:participant-left", onParticipantLeft);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
    };
  }, [getUserName, socket, user]);

  useEffect(() => {
    if (!incomingCall) {
      stopRingtone();
    }
  }, [incomingCall]);

  useEffect(() => {
    return () => {
      stopRingtone();
    };
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

  useEffect(() => {
    const storedRingtone = window.localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedCustom = window.localStorage.getItem(CUSTOM_RINGTONE_STORAGE_KEY);

    if (storedCustom) {
      try {
        const parsed = JSON.parse(storedCustom) as CustomRingtone;
        setCustomRingtoneState(parsed);
      } catch {
        window.localStorage.removeItem(CUSTOM_RINGTONE_STORAGE_KEY);
      }
    }

    if (
      storedRingtone &&
      (storedRingtone === "custom" || ringtonePresets.some((preset) => preset.id === storedRingtone))
    ) {
      setSelectedRingtone(storedRingtone);
    }
  }, []);

  const value: CallContextType = {
    currentCall,
    incomingCall,
    localStream,
    isMuted,
    isCameraEnabled,
    startDirectCall,
    startGroupCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleCamera,
    ringtonePresets,
    selectedRingtone,
    customRingtone,
    setRingtonePreset,
    useCustomRingtone,
    setCustomRingtone,
    clearCustomRingtone,
    previewRingtone,
    stopRingtonePreview: stopRingtone,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }

  return context;
};
