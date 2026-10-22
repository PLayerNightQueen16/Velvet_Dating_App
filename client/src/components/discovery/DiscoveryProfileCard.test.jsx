import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DiscoveryProfileCard from "./DiscoveryProfileCard";

describe("DiscoveryProfileCard Component (Tinder-Style Swiping & Controls)", () => {
  const mockProfile = {
    id: "profile_123",
    name: "Genevieve",
    age: 27,
    gender: "woman",
    location: "Vienna, Austria",
    occupation: "Concert Pianist",
    relationshipIntent: "long-term",
    bio: "Passionate about Chopin, vintage vinyls, and late-night espresso.",
    interests: ["Classical Music", "Vinyl Records", "Artisanal Coffee"],
    prompts: [
      { id: "pr_1", prompt: "A perfect Sunday looks like...", answer: "Browsing dusty bookstores and playing preludes." },
    ],
    photos: [
      { id: "ph_1", url: "https://res.cloudinary.com/demo/image/upload/sample1.jpg", isPrimary: true },
      { id: "ph_2", url: "https://res.cloudinary.com/demo/image/upload/sample2.jpg", isPrimary: false },
    ],
  };

  it("renders profile name, age, bio, location, and relationship intention", () => {
    render(<DiscoveryProfileCard profile={mockProfile} onLike={vi.fn()} onPass={vi.fn()} />);

    expect(screen.getByText("Genevieve")).toBeDefined();
    expect(screen.getByText("27")).toBeDefined();
    expect(screen.getByText(/Passionate about Chopin/)).toBeDefined();
    expect(screen.getByText("Vienna, Austria")).toBeDefined();
    expect(screen.getByText("Concert Pianist")).toBeDefined();
    expect(screen.getByText(/Long-Term Partner/)).toBeDefined();
  });

  it("renders interests tags correctly", () => {
    render(<DiscoveryProfileCard profile={mockProfile} onLike={vi.fn()} onPass={vi.fn()} />);

    expect(screen.getByText("Classical Music")).toBeDefined();
    expect(screen.getByText("Vinyl Records")).toBeDefined();
    expect(screen.getByText("Artisanal Coffee")).toBeDefined();
  });

  it("renders prompts and answers safely", () => {
    render(<DiscoveryProfileCard profile={mockProfile} onLike={vi.fn()} onPass={vi.fn()} />);

    expect(screen.getByText("A perfect Sunday looks like...")).toBeDefined();
    expect(screen.getByText("Browsing dusty bookstores and playing preludes.")).toBeDefined();
  });

  it("triggers onLike callback when Like button is clicked", async () => {
    const onLike = vi.fn();
    render(<DiscoveryProfileCard profile={mockProfile} onLike={onLike} onPass={vi.fn()} />);

    const likeBtn = screen.getByLabelText("Like Genevieve");
    fireEvent.click(likeBtn);

    // Button trigger starts animation and calls onLike
    await new Promise((r) => setTimeout(r, 400));
    expect(onLike).toHaveBeenCalledWith("profile_123");
  });

  it("triggers onPass callback when Pass button is clicked", async () => {
    const onPass = vi.fn();
    render(<DiscoveryProfileCard profile={mockProfile} onLike={vi.fn()} onPass={onPass} />);

    const passBtn = screen.getByLabelText("Pass on Genevieve");
    fireEvent.click(passBtn);

    await new Promise((r) => setTimeout(r, 400));
    expect(onPass).toHaveBeenCalledWith("profile_123");
  });

  it("supports keyboard shortcuts: ArrowRight for Like and ArrowLeft for Pass", async () => {
    const onLike = vi.fn();
    const onPass = vi.fn();
    const { unmount } = render(
      <DiscoveryProfileCard
        profile={mockProfile}
        onLike={onLike}
        onPass={onPass}
        isTopCard={true}
      />
    );

    // ArrowRight -> Like
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await new Promise((r) => setTimeout(r, 400));
    expect(onLike).toHaveBeenCalledWith("profile_123");

    unmount();

    // ArrowLeft -> Pass
    render(
      <DiscoveryProfileCard
        profile={mockProfile}
        onLike={onLike}
        onPass={onPass}
        isTopCard={true}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    await new Promise((r) => setTimeout(r, 400));
    expect(onPass).toHaveBeenCalledWith("profile_123");
  });

  it("disables Like and Pass buttons when isActionPending is true", () => {
    render(
      <DiscoveryProfileCard
        profile={mockProfile}
        onLike={vi.fn()}
        onPass={vi.fn()}
        isActionPending={true}
      />
    );

    const likeBtn = screen.getByLabelText("Like Genevieve");
    const passBtn = screen.getByLabelText("Pass on Genevieve");

    expect(likeBtn.hasAttribute("disabled")).toBe(true);
    expect(passBtn.hasAttribute("disabled")).toBe(true);
  });

  it("has mobile touch pan-y style to preserve vertical page scrolling", () => {
    const { container } = render(
      <DiscoveryProfileCard profile={mockProfile} onLike={vi.fn()} onPass={vi.fn()} />
    );

    const article = container.querySelector("article");
    expect(article.style.touchAction).toBe("pan-y");
  });

  it("renders LIKE and PASS visual indicator stamps for the active top card", () => {
    render(
      <DiscoveryProfileCard profile={mockProfile} onLike={vi.fn()} onPass={vi.fn()} isTopCard={true} />
    );

    expect(screen.getByText("LIKE")).toBeDefined();
    expect(screen.getByText("PASS")).toBeDefined();
  });

  it("renders gracefully when optional fields (bio, prompts, education) are missing", () => {
    const minimalProfile = {
      id: "profile_min",
      name: "Marcus",
      age: 29,
      gender: "man",
      photos: [{ id: "ph_1", url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" }],
    };

    render(<DiscoveryProfileCard profile={minimalProfile} onLike={vi.fn()} onPass={vi.fn()} />);

    expect(screen.getByText("Marcus")).toBeDefined();
    expect(screen.getByText("29")).toBeDefined();
  });
});
