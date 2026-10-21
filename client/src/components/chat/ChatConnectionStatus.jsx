import React from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

/**
 * ChatConnectionStatus
 * Displays real-time socket connection state without blocking user interaction.
 *
 * @param {"connected" | "connecting" | "disconnected"} status
 */
export default function ChatConnectionStatus({ status = "connected" }) {
  if (status === "connected") {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium border-b border-[#F2B6C2]/15 transition-all bg-[#3A0D1A]/90 text-[#FDE7E9]"
    >
      {status === "connecting" ? (
        <>
          <RefreshCw size={13} className="animate-spin text-[#D4AF97]" />
          <span>Reconnecting to live chat… Messages will be delivered via REST.</span>
        </>
      ) : (
        <>
          <WifiOff size={13} className="text-rose-400" />
          <span>Real-time disconnected. REST fallback active.</span>
        </>
      )}
    </div>
  );
}
