"use client";
import { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import React, { useEffect, useMemo, useRef } from "react";
import moment from "moment";
import { Check, CheckCheck, Paperclip } from "lucide-react";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  //   seen feature
  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);
  return (
    <div className="flex-1 overflow-hidden">
      <div className="theme-scroll h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2">
        {!selectedUser ? (
          <p className="theme-muted mt-20 text-center">
            Please select a user to start chatting 📩
          </p>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              const isSentByMe = e.sender === loggedInUser?._id;
              const uniqueKey = `${e._id}-${i}`;

              return (
                <div
                  className={`flex flex-col gap-1 mt-2 ${
                    isSentByMe ? "items-end" : "items-start"
                  }`}
                  key={uniqueKey}
                >
                  <div
                    className={`max-w-sm rounded-2xl p-3 ${
                      isSentByMe
                        ? "theme-brand text-white"
                        : "theme-panel-muted"
                    }`}
                  >
                    {e.messageType === "image" && e.image && (
                      <div className="relative group">
                        <img
                          src={e.image.url}
                          alt="shared image"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}

                    {e.messageType === "file" && e.file && (
                      <a
                        href={e.file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/10 px-3 py-2"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="break-all">{e.file.filename}</span>
                      </a>
                    )}

                    {e.text && <p className="mt-1">{e.text}</p>}
                  </div>

                  <div
                    className={`theme-muted flex items-center gap-1 text-xs ${
                      isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"
                    }`}
                  >
                    <span>{moment(e.createdAt).format("hh:mm A . MMM D")}</span>

                    {isSentByMe && (
                      <div className="flex items-center ml-1">
                        {e.seen ? (
                          <div className="flex items-center gap-1 text-blue-400">
                            <CheckCheck className="w-3 h-3" />
                            {e.seenAt && (
                              <span>{moment(e.seenAt).format("hh:mm A")}</span>
                            )}
                          </div>
                        ) : (
                          <Check className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
