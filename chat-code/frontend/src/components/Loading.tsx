import React from "react";

const Loading = () => {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center">
      <div className="theme-panel flex items-center gap-4 rounded-full px-6 py-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--text-soft)] border-t-transparent" />
        <span className="text-sm font-medium theme-soft">Loading your space...</span>
      </div>
    </div>
  );
};

export default Loading;
