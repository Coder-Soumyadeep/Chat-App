"use client";


import { User } from "@/context/AppContext";
import { useCall } from "@/context/CallContext";
import { Menu, Phone, Users, UserCircle, Video } from "lucide-react";
import React from "react";

interface ChatHeaderProps {
  user: User | null;
  setSidebarOpen: (open: boolean) => void;
  isTyping: boolean;
  onlineUsers: string[];
  onOpenGroupPicker: () => void;
}

const ChatHeader = ({
  user,
  setSidebarOpen,
  isTyping,
  onlineUsers,
  onOpenGroupPicker,
}: ChatHeaderProps) => {
  const { startDirectCall } = useCall();
  const isOnlineUser = user && onlineUsers.includes(user._id);
  return (
    <>
      {/* mobile menu toggle */}
      <div className="sm:hidden fixed top-4 right-4 z-30">
        <button
          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>
      </div>

      {/* chat header */}
      <div className="theme-panel mb-6 rounded-[1.75rem] p-6">
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="relative">
                <div
                  className="theme-panel-muted flex h-14 w-14 items-center justify-center rounded-full
                "
                >
                  <UserCircle className="h-8 w-8 theme-soft" />
                </div>
                {/* online user setup */}
                {isOnlineUser && (
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]">
                    <span className="absolute inset-0 rounded-full bg-[var(--success)] animate-ping opacity-75"></span>
                  </span>
                )}
              </div>

              {/* user info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white truncate">
                    {user.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {isTyping ? (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-blue-500 font-medium">
                        typing...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isOnlineUser ? "bg-[var(--success)]" : "bg-[var(--text-muted)]"
                        }`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${isOnlineUser ? "text-[var(--success)]" : "theme-muted"}`}
                      >
                        {isOnlineUser ? "Online" : "Offline"}{" "}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => user && startDirectCall(user, "voice")}
                  className="theme-card rounded-full p-3 transition hover:scale-[1.03]"
                  disabled={!user}
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => user && startDirectCall(user, "video")}
                  className="theme-card rounded-full p-3 transition hover:scale-[1.03]"
                  disabled={!user}
                >
                  <Video className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenGroupPicker}
                  className="theme-card rounded-full p-3 transition hover:scale-[1.03]"
                >
                  <Users className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="theme-panel-muted flex h-14 w-14 items-center justify-center rounded-full">
                <UserCircle className="h-8 w-8 theme-soft" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold theme-soft">
                  Select a conversation
                </h2>
                <p className="theme-muted mt-1 text-sm">
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
