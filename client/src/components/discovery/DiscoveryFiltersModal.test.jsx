import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DiscoveryFiltersModal from "./DiscoveryFiltersModal";

describe("DiscoveryFiltersModal Component", () => {
  const initialFilters = {
    minAge: 20,
    maxAge: 40,
    genders: ["woman"],
    relationshipIntent: "long-term",
    interests: ["Photography"],
  };

  it("renders when isOpen is true with current filter values", () => {
    render(
      <DiscoveryFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        filters={initialFilters}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText("Filter Potential Matches")).toBeDefined();
    expect(screen.getByDisplayValue("20")).toBeDefined();
    expect(screen.getByDisplayValue("40")).toBeDefined();
  });

  it("calls onApply with updated filters when submitted", () => {
    const onApply = vi.fn();
    render(
      <DiscoveryFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        filters={initialFilters}
        onApply={onApply}
        onReset={vi.fn()}
      />
    );

    const minAgeInput = screen.getByLabelText("Minimum age");
    fireEvent.change(minAgeInput, { target: { value: "22" } });

    const applyBtn = screen.getByText("Apply Filters");
    fireEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        minAge: 22,
        maxAge: 40,
      })
    );
  });

  it("shows error and prevents apply if minAge > maxAge", () => {
    const onApply = vi.fn();
    render(
      <DiscoveryFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        filters={initialFilters}
        onApply={onApply}
        onReset={vi.fn()}
      />
    );

    const minAgeInput = screen.getByLabelText("Minimum age");
    fireEvent.change(minAgeInput, { target: { value: "50" } });

    const applyBtn = screen.getByText("Apply Filters");
    fireEvent.click(applyBtn);

    expect(screen.getByText("Minimum age cannot be greater than maximum age.")).toBeDefined();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("calls onReset when Reset button is clicked", () => {
    const onReset = vi.fn();
    render(
      <DiscoveryFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        filters={initialFilters}
        onApply={vi.fn()}
        onReset={onReset}
      />
    );

    const resetBtn = screen.getByText("Reset");
    fireEvent.click(resetBtn);

    expect(onReset).toHaveBeenCalled();
  });
});
