"use client";
import { User } from "@/context/AppContext";
import {
  CornerDownRight,
  CornerUpLeft,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  Search,
  UserCircle,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: any[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
  onlineUsers: string[];
  startGroupCall: (targets: User[], callType: "voice" | "video") => void;
  searchUsers: (query: string) => Promise<User[]>;
  clearSearchResults: () => void;
}

const ChatSidebar = ({
  sidebarOpen,
  setShowAllUsers,
  setSidebarOpen,
  showAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
  onlineUsers,
  startGroupCall,
  searchUsers,
  clearSearchResults,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<User[]>([]);

  const toggleGroupUser = (user: User) => {
    setSelectedGroupUsers((prev) =>
      prev.some((item) => item._id === user._id)
        ? prev.filter((item) => item._id !== user._id)
        : [...prev, user]
    );
  };

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);

    if (value.trim().length < 2) {
      clearSearchResults();
      return;
    }

    await searchUsers(value);
  };

  return (
    <aside
      className={`theme-panel-strong fixed z-20 sm:static top-0 left-0 h-screen w-80 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 transition-transform duration-300 flex flex-col`}
    >
      {/* header */}
      <div className="border-b p-6" style={{ borderColor: "var(--border)" }}>
        <div className="sm:hidden flex justify-end mb-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="theme-card rounded-xl p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="theme-brand justify-between rounded-2xl p-2">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold">
              {showAllUsers ? "New Chat" : "Messages"}
            </h2>
          </div>

          <button
            className={`p-2.5 rounded-lg transition-colors ${
              showAllUsers
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            onClick={() => setShowAllUsers((prev) => !prev)}
          >
            {showAllUsers ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* content */}
      <div className="flex-1  overflow-hidden px-4 py-2">
        {showAllUsers ? (
          <div className="space-y-4 h-full">
            <div className="relative">
              <Search className="theme-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="Search by email or username"
                className="theme-input w-full rounded-2xl py-3 pl-10 pr-4 outline-none"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {selectedGroupUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startGroupCall(selectedGroupUsers, "voice")}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <Phone className="h-4 w-4" />
                  Voice Group
                </button>
                <button
                  type="button"
                  onClick={() => startGroupCall(selectedGroupUsers, "video")}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <Video className="h-4 w-4" />
                  Video Group
                </button>
              </div>
            )}

            {/* users list */}
            <div className="theme-scroll space-y-2 overflow-y-auto h-full pb-4">
              {searchQuery.trim().length < 2 ? (
                <div className="theme-panel-muted rounded-2xl p-4 text-sm theme-muted">
                  Type at least 2 characters to search by email or username.
                </div>
              ) : users && users.length === 0 ? (
                <div className="theme-panel-muted rounded-2xl p-4 text-sm theme-muted">
                  No users found for that search.
                </div>
              ) : (
                users
                ?.filter(
                  (u) =>
                    u._id !== loggedInUser?._id
                )
                .map((u) => (
                  <div
                    key={u._id}
                    className="theme-panel-muted rounded-2xl p-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <UserCircle className="h-6 w-6 theme-soft" />
                        {onlineUsers.includes(u._id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-gray-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                          <span className="font-medium">{u.name}</span>
                        <div className="theme-muted mt-0.5 text-xs">
                          {/* to show online offline text */}
                          {onlineUsers.includes(u._id) ? "Online" : "Offline"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleGroupUser(u)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          selectedGroupUsers.some((item) => item._id === u._id)
                            ? "border-green-500 bg-green-500/20 text-green-300"
                            : "border-[var(--border)] theme-soft"
                        }`}
                      >
                        {selectedGroupUsers.some((item) => item._id === u._id)
                          ? "Selected"
                          : "Group"}
                      </button>

                      <button
                        type="button"
                        onClick={() => createChat(u)}
                        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : chats && chats.length > 0 ? (
          <div className="theme-scroll space-y-2 overflow-y-auto h-full pb-4">
            {chats.map((chat) => {
              const latestMessage = chat.chat.latestMessage;
              const isSelected = selectedUser === chat.chat._id;
              const isSentByMe = latestMessage?.sender === loggedInUser?._id;
              const unseenCount = chat.chat.unseenCount || 0;

              return (
                <button
                  key={chat.chat._id}
                  onClick={() => {
                    setSelectedUser(chat.chat._id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    isSelected
                      ? "theme-brand border border-transparent"
                      : "theme-panel-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="theme-card flex h-12 w-12 items-center justify-center rounded-full">
                        <UserCircle className="h-7 w-7 theme-soft" />
                        {/* onlineuser ka work hai */}
                      </div>
                      {onlineUsers.includes(chat.user._id) && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold truncate ${
                            isSelected ? "text-white" : ""
                          }`}
                        >
                          {chat.user.name}
                        </span>
                        {unseenCount > 0 && (
                          <div className="bg-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-5.5 flex items-center justify-center px-2">
                            {unseenCount > 99 ? "99+" : unseenCount}
                          </div>
                        )}
                      </div>

                      {latestMessage && (
                        <div className="flex items-center gap-2">
                          {isSentByMe ? (
                            <CornerUpLeft
                              size={14}
                              className="text-blue-400 text-shrink-0"
                            />
                          ) : (
                            <CornerDownRight
                              size={14}
                              className="text-green-400 text-shrink-0"
                            />
                          )}
                          <span className="truncate flex-1 text-sm">
                            {latestMessage.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="theme-card mb-4 rounded-full p-4">
              <MessageCircle className="theme-muted h-8 w-8" />
            </div>
            <p className="font-medium theme-soft">No conversation yet</p>
            <p className="theme-muted mt-1 text-sm">
              Start a new chat to begin messaging
            </p>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="space-y-2 border-t p-4" style={{ borderColor: "var(--border)" }}>
        <Link
          href={"/profile"}
          className="theme-card flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
        >
          <div className="theme-panel-muted rounded-lg p-1.5">
            <UserCircle className="h-4 w-4 theme-soft" />
          </div>
          <span className="font-medium">Profile</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-red-500 hover:text-white"
        >
          <div className="p-1.5 bg-red-600 rounded-lg">
            <LogOut className="w-4 h-4 text-gray-300" />
          </div>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
