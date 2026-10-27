import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmationModal from "./ConfirmationModal";

describe("ConfirmationModal Component", () => {
  it("renders modal with title, description, and buttons when isOpen is true", () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Unblock Elena Crimson?"
        description="They will be able to discover your profile again."
        confirmLabel="Unblock"
        cancelLabel="Keep Blocked"
      />
    );

    expect(screen.getByText("Unblock Elena Crimson?")).toBeInTheDocument();
    expect(
      screen.getByText("They will be able to discover your profile again.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unblock" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep Blocked" })
    ).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ConfirmationModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Hidden Modal"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirmMock = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirmMock}
        confirmLabel="Proceed"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Proceed" }));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel or close button is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={onCloseMock}
        onConfirm={vi.fn()}
        cancelLabel="Cancel Action"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Action" }));
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });

  it("disables buttons and shows loading indicator when loading is true", () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading={true}
        confirmLabel="Delete"
      />
    );

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Processing/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
