import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MatchCelebrationModal from "./MatchCelebrationModal";

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("MatchCelebrationModal Component", () => {
  const mockPartner = {
    id: "partner-123",
    name: "Clara Wine",
    age: 26,
    photos: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        isPrimary: true,
      },
    ],
  };

  const mockCurrentUser = {
    name: "Julian Noir",
    photos: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/user.jpg",
        isPrimary: true,
      },
    ],
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <MatchCelebrationModal
        isOpen={false}
        onClose={vi.fn()}
        partner={mockPartner}
        currentUser={mockCurrentUser}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders celebration headline, photos, and partner name when isOpen is true", () => {
    render(
      <MatchCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        partner={mockPartner}
        currentUser={mockCurrentUser}
      />
    );

    expect(screen.getByText("It's a Match!")).toBeDefined();
    expect(screen.getByText("Clara Wine")).toBeDefined();
    expect(
      screen.getByText(/have expressed mutual interest in each other/i)
    ).toBeDefined();
    expect(screen.getByAltText("Clara Wine's photo")).toBeDefined();
    expect(screen.getByAltText("Julian Noir")).toBeDefined();
  });

  it("calls onClose when Keep Discovering button is clicked", () => {
    const onClose = vi.fn();
    render(
      <MatchCelebrationModal
        isOpen={true}
        onClose={onClose}
        partner={mockPartner}
        currentUser={mockCurrentUser}
      />
    );

    const keepDiscoveringBtn = screen.getByText("Keep Discovering");
    fireEvent.click(keepDiscoveringBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose and navigates to /matches when View Matches is clicked", () => {
    const onClose = vi.fn();
    render(
      <MatchCelebrationModal
        isOpen={true}
        onClose={onClose}
        partner={mockPartner}
        currentUser={mockCurrentUser}
      />
    );

    const viewMatchesBtn = screen.getByText("View Matches");
    fireEvent.click(viewMatchesBtn);
    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/matches");
  });

  it("dismisses on Escape key press", () => {
    const onClose = vi.fn();
    render(
      <MatchCelebrationModal
        isOpen={true}
        onClose={onClose}
        partner={mockPartner}
        currentUser={mockCurrentUser}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
