import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageComposer from "./MessageComposer";

describe("MessageComposer Component", () => {
  it("renders textarea and submit button", () => {
    render(<MessageComposer onSend={vi.fn()} />);
    expect(screen.getByLabelText("Message text")).toBeDefined();
    expect(screen.getByRole("button", { name: /send message/i })).toBeDefined();
  });

  it("submits message object on Enter keypress and clears input", () => {
    const onSendMock = vi.fn().mockResolvedValue();
    render(<MessageComposer onSend={onSendMock} />);

    const textarea = screen.getByLabelText("Message text");
    fireEvent.change(textarea, { target: { value: "Hello beautiful!" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSendMock).toHaveBeenCalledWith({ text: "Hello beautiful!" });
  });

  it("does not submit on Shift+Enter (allows newline)", () => {
    const onSendMock = vi.fn();
    render(<MessageComposer onSend={onSendMock} />);

    const textarea = screen.getByLabelText("Message text");
    fireEvent.change(textarea, { target: { value: "Line one" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(onSendMock).not.toHaveBeenCalled();
  });

  it("does not submit empty or whitespace-only messages", () => {
    const onSendMock = vi.fn();
    render(<MessageComposer onSend={onSendMock} />);

    const textarea = screen.getByLabelText("Message text");
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSendMock).not.toHaveBeenCalled();

    const sendBtn = screen.getByRole("button", { name: /send message/i });
    expect(sendBtn.hasAttribute("disabled")).toBe(true);
  });

  it("displays character counter when text exceeds 1500 chars", () => {
    render(<MessageComposer onSend={vi.fn()} />);
    const textarea = screen.getByLabelText("Message text");

    const longText = "a".repeat(1600);
    fireEvent.change(textarea, { target: { value: longText } });

    expect(screen.getByText("1600 / 2000")).toBeDefined();
  });

  it("does not show counter below 1500 chars", () => {
    render(<MessageComposer onSend={vi.fn()} />);
    const textarea = screen.getByLabelText("Message text");

    fireEvent.change(textarea, { target: { value: "Short text" } });

    expect(screen.queryByText(/\/ 2000/)).toBeNull();
  });

  it("disables send when disabled prop is true", () => {
    const onSendMock = vi.fn();
    render(<MessageComposer onSend={onSendMock} disabled={true} />);

    const textarea = screen.getByLabelText("Message text");
    expect(textarea.hasAttribute("disabled")).toBe(true);

    const sendBtn = screen.getByRole("button", { name: /send message/i });
    expect(sendBtn.hasAttribute("disabled")).toBe(true);
  });
});
