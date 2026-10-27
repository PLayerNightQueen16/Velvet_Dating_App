import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportModal from "./ReportModal";
import * as api from "../../services/api";

describe("ReportModal Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockTarget = {
    id: "user-target-123",
    name: "Elena Crimson",
  };

  it("renders modal with reasons dropdown and details textarea when isOpen is true", () => {
    render(
      <ReportModal
        isOpen={true}
        onClose={vi.fn()}
        targetUser={mockTarget}
      />
    );

    expect(screen.getByText("Report Elena Crimson")).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for report/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Provide any context/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit Report/i })
    ).toBeInTheDocument();
  });

  it("submits report with selected reason and optional details", async () => {
    const submitSpy = vi.spyOn(api, "submitReport").mockResolvedValueOnce({
      success: true,
      message: "Report submitted.",
    });

    const onReportSuccessMock = vi.fn();

    render(
      <ReportModal
        isOpen={true}
        onClose={vi.fn()}
        targetUser={mockTarget}
        onReportSuccess={onReportSuccessMock}
      />
    );

    fireEvent.change(screen.getByLabelText(/Reason for report/i), {
      target: { value: "spam" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Provide any context/i), {
      target: { value: "Promoting third party links" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Report/i }));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith("user-target-123", {
        reason: "spam",
        details: "Promoting third party links",
      });
      expect(screen.getByText("Report Submitted")).toBeInTheDocument();
    });
  });

  it("triggers blockUser when alsoBlock checkbox is checked", async () => {
    vi.spyOn(api, "submitReport").mockResolvedValueOnce({ success: true });
    const blockSpy = vi.spyOn(api, "blockUser").mockResolvedValueOnce({ success: true });

    render(
      <ReportModal
        isOpen={true}
        onClose={vi.fn()}
        targetUser={mockTarget}
      />
    );

    const checkbox = screen.getByLabelText(/Also block Elena Crimson/i);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /Submit Report/i }));

    await waitFor(() => {
      expect(blockSpy).toHaveBeenCalledWith("user-target-123");
    });
  });
});
