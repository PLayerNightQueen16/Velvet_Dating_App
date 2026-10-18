import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UnmatchConfirmModal from "./UnmatchConfirmModal";

describe("UnmatchConfirmModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <UnmatchConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        partnerName="Elena"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders warning copy and partner name when isOpen is true", () => {
    render(
      <UnmatchConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        partnerName="Elena"
      />
    );

    expect(screen.getByText("Unmatch Elena?")).toBeDefined();
    expect(
      screen.getByText(/You’ll no longer see this connection in your Matches/i)
    ).toBeDefined();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(
      <UnmatchConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        partnerName="Elena"
      />
    );

    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onConfirm when Unmatch button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <UnmatchConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        partnerName="Elena"
      />
    );

    const unmatchBtn = screen.getByRole("button", { name: "Unmatch" });
    fireEvent.click(unmatchBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("dismisses on Escape key press", () => {
    const onClose = vi.fn();
    render(
      <UnmatchConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        partnerName="Elena"
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
