import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MatchesPage from "./MatchesPage";
import * as api from "../services/api";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      name: "Julian Noir",
      photos: [{ url: "https://example.com/user.jpg", isPrimary: true }],
    },
  }),
}));

vi.mock("../services/api", () => ({
  getMatches: vi.fn(),
  unmatchConnection: vi.fn(),
}));

describe("MatchesPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMatches = [
    {
      matchId: "match-123",
      matchedAt: new Date("2026-10-27T10:00:00Z").toISOString(),
      partner: {
        id: "partner-123",
        name: "Elena Crimson",
        age: 27,
        bio: "Curator of fine art and twilight walks",
        interests: ["Poetry", "Wine Tasting"],
        photos: [{ url: "https://example.com/elena.jpg", isPrimary: true }],
      },
    },
  ];

  it("renders active matches list successfully", async () => {
    api.getMatches.mockResolvedValueOnce({
      success: true,
      data: {
        matches: mockMatches,
        pagination: { total: 1, page: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("matches-loading")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Elena Crimson")).toBeDefined();
    });

    expect(screen.getByText("27")).toBeDefined();
    expect(screen.getByText("Curator of fine art and twilight walks")).toBeDefined();
    expect(screen.getByRole("button", { name: /unmatch elena crimson/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /view elena crimson's profile/i })).toBeDefined();
  });

  it("shows empty state when no active matches exist", async () => {
    api.getMatches.mockResolvedValueOnce({
      success: true,
      data: {
        matches: [],
        pagination: { total: 0, page: 1, totalPages: 0 },
      },
    });

    render(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No matches yet")).toBeDefined();
    });
  });

  it("opens confirmation modal when unmatch is clicked, and cancels without calling API", async () => {
    api.getMatches.mockResolvedValueOnce({
      success: true,
      data: {
        matches: mockMatches,
        pagination: { total: 1, page: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elena Crimson")).toBeDefined();
    });

    const unmatchBtn = screen.getByRole("button", { name: /unmatch elena crimson/i });
    fireEvent.click(unmatchBtn);

    expect(screen.getByText("Unmatch Elena Crimson?")).toBeDefined();

    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);

    expect(api.unmatchConnection).not.toHaveBeenCalled();
    expect(screen.getByText("Elena Crimson")).toBeDefined();
  });

  it("successfully unmatches and removes match card when confirmed", async () => {
    api.getMatches.mockResolvedValueOnce({
      success: true,
      data: {
        matches: mockMatches,
        pagination: { total: 1, page: 1, totalPages: 1 },
      },
    });
    api.unmatchConnection.mockResolvedValueOnce({
      success: true,
      message: "Unmatched successfully.",
    });

    render(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elena Crimson")).toBeDefined();
    });

    const unmatchBtn = screen.getByRole("button", { name: /unmatch elena crimson/i });
    fireEvent.click(unmatchBtn);

    const confirmBtn = screen.getByRole("button", { name: "Unmatch" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.unmatchConnection).toHaveBeenCalledWith("match-123");
      expect(screen.queryByText("Elena Crimson")).toBeNull();
    });
  });
});
