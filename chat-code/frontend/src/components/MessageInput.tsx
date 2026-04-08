"use client";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import React, { useState } from "react";

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (message: string) => void;
  handleMessageSend: (e: any, attachmentFile?: File | null) => void;
}

const MessageInput = ({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
}: MessageInputProps) => {
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!message.trim() && !attachmentFile) return;

    setIsUploading(true);
    await handleMessageSend(e, attachmentFile);
    setAttachmentFile(null);
    setIsUploading(false);
  };

  if (!selectedUser) return null;
  const isImageAttachment = attachmentFile?.type.startsWith("image/");
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t pt-3"
      style={{ borderColor: "var(--border)" }}
    >
      {attachmentFile && (
        <div className="relative w-fit">
          {isImageAttachment ? (
            <img
              src={URL.createObjectURL(attachmentFile)}
              alt="preview"
              className="h-24 w-24 rounded-2xl object-cover"
              style={{ border: "1px solid var(--border)" }}
            />
          ) : (
            <div className="theme-panel-muted rounded-2xl px-3 py-2 text-sm">
              {attachmentFile.name}
            </div>
          )}
          <button
            type="button"
            className="theme-card absolute -right-2 -top-2 rounded-full p-1"
            onClick={() => setAttachmentFile(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="theme-card cursor-pointer rounded-2xl px-3 py-2 transition-colors">
          <Paperclip size={18} className="theme-soft" />
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAttachmentFile(file);
              }
            }}
          />
        </label>

        <input
          type="text"
          className="theme-input flex-1 rounded-2xl px-4 py-3 outline-none transition focus:border-[var(--brand)]"
          placeholder={attachmentFile ? "Add a caption..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="submit"
          disabled={(!attachmentFile && !message) || isUploading}
          className="theme-brand flex items-center gap-1 rounded-2xl px-4 py-3 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
