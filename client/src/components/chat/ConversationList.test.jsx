import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConversationList from "./ConversationList";

describe("ConversationList Component", () => {
  const mockConversations = [
    {
      matchId: "match-1",
      partner: {
        id: "partner-1",
        name: "Elena Crimson",
        age: 27,
        photos: [{ url: "https://example.com/elena.jpg", isPrimary: true }],
      },
      lastMessage: {
        _id: "msg-1",
        text: "See you at the art gallery!",
        createdAt: "2026-10-27T14:30:00.000Z",
        isOwn: false,
      },
      unreadCount: 2,
    },
    {
      matchId: "match-2",
      partner: {
        id: "partner-2",
        name: "Chloe Noir",
        age: 25,
        photos: [{ url: "https://example.com/chloe.jpg", isPrimary: true }],
      },
      lastMessage: null,
      unreadCount: 0,
    },
  ];

  it("renders conversation list with partner name and last message preview", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        selectedMatchId={null}
        onSelectMatch={vi.fn()}
      />
    );

    expect(screen.getByText("Elena Crimson")).toBeDefined();
    expect(screen.getByText("See you at the art gallery!")).toBeDefined();

    expect(screen.getByText("Chloe Noir")).toBeDefined();
    // Null lastMessage shows "Start the conversation" placeholder
    expect(screen.getByText("Start the conversation")).toBeDefined();
  });

  it("renders unread badge with correct count", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        selectedMatchId={null}
        onSelectMatch={vi.fn()}
      />
    );

    const badge = screen.getByTestId("unread-badge-match-1");
    expect(badge.textContent).toBe("2");
  });

  it("filters conversations by partner name query", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        selectedMatchId={null}
        onSelectMatch={vi.fn()}
      />
    );

    const searchInput = screen.getByLabelText("Search conversations");
    fireEvent.change(searchInput, { target: { value: "Elena" } });

    expect(screen.getByText("Elena Crimson")).toBeDefined();
    expect(screen.queryByText("Chloe Noir")).toBeNull();
  });

  it("calls onSelectMatch with matchId when conversation is clicked", () => {
    const onSelectMock = vi.fn();
    render(
      <ConversationList
        conversations={mockConversations}
        selectedMatchId={null}
        onSelectMatch={onSelectMock}
      />
    );

    const elenaItem = screen.getByTestId("conversation-item-match-1");
    fireEvent.click(elenaItem);

    expect(onSelectMock).toHaveBeenCalledWith("match-1");
  });

  it("calls onSelectConversation alias when provided", () => {
    const onSelectMock = vi.fn();
    render(
      <ConversationList
        conversations={mockConversations}
        activeMatchId={null}
        onSelectConversation={onSelectMock}
      />
    );

    const elenaItem = screen.getByTestId("conversation-item-match-1");
    fireEvent.click(elenaItem);

    expect(onSelectMock).toHaveBeenCalledWith("match-1");
  });

  it("renders empty state when no conversations exist", () => {
    render(
      <ConversationList
        conversations={[]}
        selectedMatchId={null}
        onSelectMatch={vi.fn()}
      />
    );

    expect(screen.getByText("No conversations yet")).toBeDefined();
  });

  it("renders no-results state when search finds nothing", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        selectedMatchId={null}
        onSelectMatch={vi.fn()}
      />
    );

    const searchInput = screen.getByLabelText("Search conversations");
    fireEvent.change(searchInput, { target: { value: "Zzz" } });

    expect(screen.getByText("No matches found")).toBeDefined();
  });
});
