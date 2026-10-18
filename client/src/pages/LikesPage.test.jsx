import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LikesPage from "./LikesPage";
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
  getIncomingLikes: vi.fn(),
  getOutgoingLikes: vi.fn(),
  likeProfile: vi.fn(),
  passProfile: vi.fn(),
  withdrawLike: vi.fn(),
}));

describe("LikesPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfiles = [
    {
      id: "p1",
      name: "Sophia Rose",
      age: 25,
      bio: "Romantic poet and coffee enthusiast",
      interests: ["Art", "Wine"],
      photos: [{ url: "https://example.com/sophia.jpg", isPrimary: true }],
      likedAt: new Date().toISOString(),
    },
  ];

  it("renders loading state initially and then shows received likes", async () => {
    api.getIncomingLikes.mockResolvedValueOnce({
      success: true,
      data: {
        profiles: mockProfiles,
        pagination: { total: 1, page: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <LikesPage defaultTab="received" />
      </MemoryRouter>
    );

    expect(screen.getByTestId("likes-loading")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Sophia Rose")).toBeDefined();
    });

    expect(screen.getByText("25")).toBeDefined();
    expect(screen.getByText("Romantic poet and coffee enthusiast")).toBeDefined();
    expect(screen.getByRole("button", { name: /like back sophia rose/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /pass on sophia rose/i })).toBeDefined();
  });

  it("shows empty state when no incoming likes exist", async () => {
    api.getIncomingLikes.mockResolvedValueOnce({
      success: true,
      data: {
        profiles: [],
        pagination: { total: 0, page: 1, totalPages: 0 },
      },
    });

    render(
      <MemoryRouter>
        <LikesPage defaultTab="received" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No incoming likes yet")).toBeDefined();
    });
  });

  it("switches to sent likes tab and calls getOutgoingLikes", async () => {
    api.getIncomingLikes.mockResolvedValueOnce({
      success: true,
      data: { profiles: [], pagination: {} },
    });
    api.getOutgoingLikes.mockResolvedValueOnce({
      success: true,
      data: {
        profiles: [
          {
            id: "p2",
            name: "Lucas Wine",
            age: 28,
            photos: [{ url: "https://example.com/lucas.jpg" }],
            likedAt: new Date().toISOString(),
          },
        ],
        pagination: { total: 1, page: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter initialEntries={["/likes/received"]}>
        <LikesPage />
      </MemoryRouter>
    );

    const sentTabBtn = screen.getByRole("button", { name: /sent likes/i });
    fireEvent.click(sentTabBtn);

    await waitFor(() => {
      expect(api.getOutgoingLikes).toHaveBeenCalled();
      expect(screen.getByText("Lucas Wine")).toBeDefined();
    });

    expect(screen.getByRole("button", { name: /withdraw like to lucas wine/i })).toBeDefined();
  });

  it("triggers celebration modal when Like Back creates a new mutual match", async () => {
    api.getIncomingLikes.mockResolvedValueOnce({
      success: true,
      data: {
        profiles: mockProfiles,
        pagination: { total: 1, page: 1, totalPages: 1 },
      },
    });

    api.likeProfile.mockResolvedValueOnce({
      success: true,
      data: {
        liked: true,
        matched: true,
        isNewMatch: true,
        match: { id: "m1", matchedAt: new Date().toISOString() },
      },
    });

    render(
      <MemoryRouter>
        <LikesPage defaultTab="received" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sophia Rose")).toBeDefined();
    });

    const likeBackBtn = screen.getByRole("button", { name: /like back sophia rose/i });
    fireEvent.click(likeBackBtn);

    await waitFor(() => {
      expect(api.likeProfile).toHaveBeenCalledWith("p1");
      expect(screen.getByText("It's a Match!")).toBeDefined();
    });
  });

  it("calls withdrawLike when withdraw button is clicked in sent tab", async () => {
    api.getOutgoingLikes.mockResolvedValueOnce({
      success: true,
      data: {
        profiles: mockProfiles,
        pagination: { total: 1, page: 1, totalPages: 1 },
      },
    });
    api.withdrawLike.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter initialEntries={["/likes/sent"]}>
        <LikesPage defaultTab="sent" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sophia Rose")).toBeDefined();
    });

    const withdrawBtn = screen.getByRole("button", { name: /withdraw like to sophia rose/i });
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
      expect(api.withdrawLike).toHaveBeenCalledWith("p1");
    });
  });
});
