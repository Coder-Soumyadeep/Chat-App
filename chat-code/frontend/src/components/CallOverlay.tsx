"use client";

import { useCall } from "@/context/CallContext";
import {
  Mic,
  MicOff,
  MonitorUp,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import React, { useEffect, useRef } from "react";

const MediaTile = ({
  stream,
  label,
  isVideo,
  muted = false,
}: {
  stream: MediaStream | null;
  label: string;
  isVideo: boolean;
  muted?: boolean;
}) => {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!mediaRef.current) return;
    mediaRef.current.srcObject = stream;
  }, [stream]);

  if (!stream) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-gray-300">
        Connecting to {label}...
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={(node) => {
            mediaRef.current = node;
          }}
          autoPlay
          playsInline
          muted={muted}
          className="h-48 w-full object-cover"
        />
        <div className="border-t border-white/10 bg-black/70 px-3 py-2 text-sm text-white">
          {label}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
      <audio
        ref={(node) => {
          mediaRef.current = node;
        }}
        autoPlay
        playsInline
        muted={muted}
      />
      <div className="mb-3 rounded-full bg-blue-600/20 p-4">
        <Phone className="h-8 w-8 text-blue-300" />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
};

const CallOverlay = () => {
  const {
    currentCall,
    incomingCall,
    localStream,
    isMuted,
    isCameraEnabled,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  if (!currentCall && !incomingCall) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {incomingCall && !currentCall && (
        <div className="theme-panel-strong pointer-events-auto w-full max-w-md rounded-3xl p-6 shadow-2xl">
          <div className="mb-2 text-lg font-semibold">
            Incoming {incomingCall.isGroup ? "group " : ""}
            {incomingCall.callType} call
          </div>
          <p className="theme-soft mb-6 text-sm">
            {incomingCall.callerName} is calling you
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={rejectIncomingCall}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Decline
            </button>
            <button
              onClick={acceptIncomingCall}
              className="rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {currentCall && (
        <div className="theme-panel-strong pointer-events-auto w-full max-w-5xl rounded-3xl p-4 shadow-2xl sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">
                {currentCall.isGroup ? "Group" : "Private"} {currentCall.callType} call
              </div>
              <div className="theme-soft text-sm">
                {currentCall.status === "calling" && "Calling..."}
                {currentCall.status === "ringing" && "Ringing..."}
                {currentCall.status === "connecting" && "Connecting..."}
                {currentCall.status === "connected" && "Connected"}
              </div>
            </div>
            <button
              onClick={endCall}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              End Call
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MediaTile
              stream={localStream}
              label="You"
              isVideo={currentCall.callType === "video"}
              muted
            />
            {currentCall.participants.map((participant) => (
              <MediaTile
                key={participant.userId}
                stream={participant.stream}
                label={participant.name}
                isVideo={currentCall.callType === "video"}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={toggleMute}
              className="theme-card rounded-full p-4"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            {currentCall.callType === "video" && (
              <button
                onClick={toggleCamera}
                className="theme-card rounded-full p-4"
              >
                {isCameraEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </button>
            )}
            <div className="theme-card rounded-full p-4">
              <MonitorUp className="h-5 w-5" />
            </div>
            <button
              onClick={endCall}
              className="rounded-full bg-red-600 p-4 text-white"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
