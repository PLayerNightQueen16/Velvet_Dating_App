import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Chat from "./Chat";
import * as api from "../services/api";

const mockSocket = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock("../services/socket", () => ({
  getSocket: () => mockSocket,
  connectSocket: () => mockSocket,
  disconnectSocket: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      name: "Julian Noir",
      photos: [{ url: "https://example.com/julian.jpg", isPrimary: true }],
    },
  }),
}));

vi.mock("../services/api", () => ({
  getConversations: vi.fn(),
  getChatHistory: vi.fn(),
  sendMessageRest: vi.fn(),
  markChatRead: vi.fn(),
  getUnreadCounts: vi.fn(),
}));

describe("Chat Page Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.on.mockImplementation(() => {});
    mockSocket.off.mockImplementation(() => {});
    mockSocket.emit.mockImplementation(() => {});
  });

  const mockPartner = {
    id: "partner-101",
    name: "Elena Crimson",
    age: 27,
    location: { city: "Paris" },
    photos: [{ url: "https://example.com/elena.jpg", isPrimary: true }],
  };

  const mockConversations = [
    {
      matchId: "match-101",
      partner: mockPartner,
      lastMessage: {
        _id: "msg-1",
        text: "Are you free this weekend?",
        createdAt: "2026-10-27T10:00:00.000Z",
        isOwn: false,
      },
      unreadCount: 1,
    },
  ];

  const mockMessages = [
    {
      _id: "msg-1",
      id: "msg-1",
      clientMessageId: "c-1",
      match: "match-101",
      senderId: "partner-101",
      recipientId: "user-1",
      text: "Are you free this weekend?",
      createdAt: "2026-10-27T10:00:00.000Z",
      readAt: null,
      isPending: false,
      isFailed: false,
      isRead: false,
    },
  ];

  it("renders conversation list and desktop empty-pane placeholder", async () => {
    api.getConversations.mockResolvedValueOnce({
      success: true,
      conversations: mockConversations,
    });

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elena Crimson")).toBeDefined();
    });

    expect(screen.getByText("Are you free this weekend?")).toBeDefined();
    expect(screen.getByText("Intimate Conversations")).toBeDefined();
  });

  it("loads and displays chronological messages when matchId is in URL", async () => {
    api.getConversations.mockResolvedValueOnce({
      success: true,
      conversations: mockConversations,
    });
    api.getChatHistory.mockResolvedValueOnce({
      success: true,
      messages: mockMessages,
      hasMore: false,
      nextCursor: null,
      partner: mockPartner,
    });
    api.markChatRead.mockResolvedValueOnce({
      success: true,
      updatedCount: 1,
    });

    render(
      <MemoryRouter initialEntries={["/chat/match-101"]}>
        <Routes>
          <Route path="/chat/:matchId" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Are you free this weekend?").length).toBeGreaterThan(0);
    });

    // Message composer should be present
    expect(screen.getByLabelText("Message text")).toBeDefined();
  });

  it("sends a message via REST fallback when socket is disconnected", async () => {
    api.getConversations.mockResolvedValueOnce({
      success: true,
      conversations: mockConversations,
    });
    api.getChatHistory.mockResolvedValueOnce({
      success: true,
      messages: mockMessages,
      hasMore: false,
      nextCursor: null,
      partner: mockPartner,
    });
    api.markChatRead.mockResolvedValueOnce({
      success: true,
      updatedCount: 0,
    });

    // Return the expected REST response shape (restRes.data should be the message)
    const sentMessage = {
      _id: "msg-2",
      id: "msg-2",
      clientMessageId: expect.any(String),
      match: "match-101",
      senderId: "user-1",
      recipientId: "partner-101",
      text: "Yes, let's meet for wine!",
      createdAt: new Date().toISOString(),
      readAt: null,
      isPending: false,
      isFailed: false,
    };
    api.sendMessageRest.mockResolvedValueOnce({
      success: true,
      data: sentMessage,
    });

    render(
      <MemoryRouter initialEntries={["/chat/match-101"]}>
        <Routes>
          <Route path="/chat/:matchId" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Are you free this weekend?").length).toBeGreaterThan(0);
    });

    const input = screen.getByLabelText("Message text");
    fireEvent.change(input, { target: { value: "Yes, let's meet for wine!" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(api.sendMessageRest).toHaveBeenCalledWith(
        "match-101",
        expect.objectContaining({
          text: "Yes, let's meet for wine!",
        })
      );
    });
  });

  it("shows empty conversation state when matched pair has no messages yet", async () => {
    api.getConversations.mockResolvedValueOnce({
      success: true,
      conversations: [{ ...mockConversations[0], lastMessage: null }],
    });
    api.getChatHistory.mockResolvedValueOnce({
      success: true,
      messages: [],
      hasMore: false,
      nextCursor: null,
      partner: mockPartner,
    });
    api.markChatRead.mockResolvedValueOnce({
      success: true,
      updatedCount: 0,
    });

    render(
      <MemoryRouter initialEntries={["/chat/match-101"]}>
        <Routes>
          <Route path="/chat/:matchId" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/You matched with Elena Crimson/i)).toBeDefined();
    });

    expect(screen.getByText(/Break the ice/i)).toBeDefined();
  });
});
