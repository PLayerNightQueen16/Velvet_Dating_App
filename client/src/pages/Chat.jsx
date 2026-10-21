import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getConversations } from "../services/api";
import { getSocket } from "../services/socket";
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";

/**
 * Chat Page
 * Responsive one-to-one messaging page with dual-pane layout on desktop
 * and seamless navigation on mobile.
 */
export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load active conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await getConversations({ limit: 50 });
      if (res.success && res.conversations) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Socket listener for conversation-level unread updates
  useEffect(() => {
    const socket = getSocket();

    const handleUnreadUpdate = () => {
      // Refresh list to sync badges and last messages
      loadConversations();
    };

    socket.on("chat:unread:update", handleUnreadUpdate);
    return () => {
      socket.off("chat:unread:update", handleUnreadUpdate);
    };
  }, [loadConversations]);

  // When a message is sent or received in the active conversation, update list preview
  const handleConversationUpdated = (updatedMatchId, messageDTO) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.matchId === updatedMatchId
          ? {
              ...c,
              lastMessage: messageDTO,
              unreadCount: 0,
            }
          : c
      )
    );
  };

  const handleSelectMatch = (selectedId) => {
    navigate(`/chat/${selectedId}`);
  };

  const handleBackToList = () => {
    navigate("/chat");
  };

  return (
    <div className="pt-20 h-screen flex flex-col bg-[#1A0F13] text-[#F8EDEB] overflow-hidden">
      <div className="flex-1 flex overflow-hidden border-t border-[rgba(242,182,194,0.12)]">
        {/* Left Pane: Conversation List */}
        <aside
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
            matchId ? "hidden md:flex flex-col" : "flex flex-col"
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedMatchId={matchId}
            onSelectMatch={handleSelectMatch}
            loading={loading}
          />
        </aside>

        {/* Right Pane: Active Chat Window or Desktop Empty Placeholder */}
        <main
          className={`flex-1 h-full ${
            !matchId ? "hidden md:flex flex-col" : "flex flex-col"
          }`}
        >
          {matchId ? (
            <ChatWindow
              matchId={matchId}
              currentUser={user}
              onBack={handleBackToList}
              onConversationUpdated={handleConversationUpdated}
            />
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-[#1A0F13]/50">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3A0D1A]/80 border border-[#D4AF97]/30 text-[#D4AF97] mb-4 shadow-lg">
                <MessageSquare size={28} />
              </div>
              <h2
                className="text-2xl font-serif font-bold text-[#FDE7E9] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Intimate Conversations
              </h2>
              <p className="text-sm text-[#F2B6C2]/70 max-w-sm leading-relaxed">
                Select a match from the left to read and send messages. Genuine conversations begin with a single spark.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
