import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Settings from "./Settings";
import * as api from "../services/api";
import * as AuthContext from "../context/AuthContext";

describe("Settings Page Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: {
        id: "current-user-123",
        name: "Sophia Rose",
        username: "sophia_rose",
      },
      logout: vi.fn().mockResolvedValue(true),
      updateUser: vi.fn(),
    });
  });

  it("renders Settings header and all 4 navigation tabs", async () => {
    vi.spyOn(api, "getPrivacySettings").mockResolvedValueOnce({
      success: true,
      privacy: {
        discoverable: true,
        showOnlineStatus: true,
        showLastActive: true,
      },
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByText("Settings & Privacy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Privacy & Discovery/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Security & Password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Blocked Users/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Account Deletion/i })).toBeInTheDocument();
  });

  it("loads and saves privacy discoverability preferences", async () => {
    vi.spyOn(api, "getPrivacySettings").mockResolvedValueOnce({
      success: true,
      privacy: {
        discoverable: true,
        showOnlineStatus: true,
        showLastActive: true,
      },
    });

    const updateSpy = vi.spyOn(api, "updatePrivacySettings").mockResolvedValueOnce({
      success: true,
      privacy: {
        discoverable: false,
        showOnlineStatus: true,
        showLastActive: true,
      },
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Show my profile in Discovery feed/i)).toBeInTheDocument();
    });

    const toggle = screen.getByRole("switch", { name: /Show my profile in Discovery feed/i });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(screen.getByRole("button", { name: /Save Privacy Preferences/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ discoverable: false })
      );
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  it("validates and submits password change form on Security tab", async () => {
    vi.spyOn(api, "getPrivacySettings").mockResolvedValueOnce({ success: true, privacy: {} });
    const changePassSpy = vi.spyOn(api, "changePassword").mockResolvedValueOnce({
      success: true,
      message: "Password changed successfully.",
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    // Switch to Security tab
    fireEvent.click(screen.getByRole("button", { name: /Security & Password/i }));

    const currentPassInput = screen.getByPlaceholderText(/Enter your current password/i);
    const newPassInput = screen.getByPlaceholderText(/At least 6 characters/i);
    const confirmPassInput = screen.getByPlaceholderText(/Re-type new password/i);

    fireEvent.change(currentPassInput, { target: { value: "oldPassword123" } });
    fireEvent.change(newPassInput, { target: { value: "newPassword999" } });
    fireEvent.change(confirmPassInput, { target: { value: "newPassword999" } });

    fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

    await waitFor(() => {
      expect(changePassSpy).toHaveBeenCalledWith({
        currentPassword: "oldPassword123",
        newPassword: "newPassword999",
        confirmPassword: "newPassword999",
      });
      expect(screen.getByText(/Password updated successfully/i)).toBeInTheDocument();
    });
  });

  it("loads blocked users list and confirms unblocking", async () => {
    vi.spyOn(api, "getPrivacySettings").mockResolvedValueOnce({ success: true, privacy: {} });
    vi.spyOn(api, "getBlockedUsers").mockResolvedValueOnce({
      success: true,
      data: {
        blockedUsers: [
          {
            id: "blocked-user-99",
            name: "Alexander Noir",
            username: "alex_noir",
            age: 29,
            photoUrl: "https://cloudinary.com/alex.jpg",
          },
        ],
      },
    });

    const unblockSpy = vi.spyOn(api, "unblockUser").mockResolvedValueOnce({
      success: true,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    // Switch to Blocked tab
    fireEvent.click(screen.getByRole("button", { name: /Blocked Users/i }));

    await waitFor(() => {
      expect(screen.getByText("Alexander Noir, 29")).toBeInTheDocument();
    });

    // Click Unblock to trigger modal
    fireEvent.click(screen.getByRole("button", { name: "Unblock" }));

    expect(screen.getByText(/Unblock Alexander Noir\?/i)).toBeInTheDocument();

    // Confirm in modal
    const confirmBtn = screen.getAllByRole("button", { name: "Unblock" })[1];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(unblockSpy).toHaveBeenCalledWith("blocked-user-99");
    });
  });
});
