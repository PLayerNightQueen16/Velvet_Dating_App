import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "./MessageBubble";

describe("MessageBubble Component", () => {
  const baseMessage = {
    id: "msg-1",
    clientMessageId: "client-1",
    text: "Hello there, Julian!",
    senderId: "user-1",
    createdAt: "2026-10-27T12:00:00.000Z",
    readAt: null,
    isPending: false,
    isFailed: false,
    isRead: false,
  };

  it("renders message text correctly", () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOutgoing={true}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Hello there, Julian!")).toBeDefined();
  });

  it("renders sent checkmark for outgoing delivered message", () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOutgoing={true}
        onRetry={vi.fn()}
      />
    );

    // Sent indicator - has title="Sent"
    const sentEl = document.querySelector('[title="Sent"]');
    expect(sentEl).not.toBeNull();
  });

  it("renders read double-checkmark when isRead is true", () => {
    const readMessage = { ...baseMessage, isRead: true };

    render(
      <MessageBubble
        message={readMessage}
        isOutgoing={true}
        onRetry={vi.fn()}
      />
    );

    const readEl = document.querySelector('[title="Read"]');
    expect(readEl).not.toBeNull();
  });

  it("renders read indicator when readAt is set", () => {
    const readMessage = { ...baseMessage, readAt: "2026-10-27T12:05:00.000Z" };

    render(
      <MessageBubble
        message={readMessage}
        isOutgoing={true}
        onRetry={vi.fn()}
      />
    );

    const readEl = document.querySelector('[title="Read"]');
    expect(readEl).not.toBeNull();
  });

  it("shows pending/sending state with text 'Sending…'", () => {
    const pendingMessage = { ...baseMessage, isPending: true };

    render(
      <MessageBubble
        message={pendingMessage}
        isOutgoing={true}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Sending…")).toBeDefined();
  });

  it("renders received message without own delivery indicators", () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOutgoing={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Hello there, Julian!")).toBeDefined();
    expect(document.querySelector('[title="Sent"]')).toBeNull();
    expect(document.querySelector('[title="Read"]')).toBeNull();
  });

  it("shows retry button and calls onRetry when message failed", () => {
    const onRetryMock = vi.fn();
    const failedMessage = { ...baseMessage, isFailed: true };

    render(
      <MessageBubble
        message={failedMessage}
        isOutgoing={true}
        onRetry={onRetryMock}
      />
    );

    const retryBtn = screen.getByTitle("Retry sending");
    fireEvent.click(retryBtn);

    expect(onRetryMock).toHaveBeenCalledWith(failedMessage);
  });
});
