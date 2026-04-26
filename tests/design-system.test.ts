import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("visual design system", () => {
  it("defines a command-center motion layer with reduced motion support", () => {
    expect(css).toContain("--motion-fast");
    expect(css).toContain("@keyframes panelRise");
    expect(css).toContain("@keyframes scanLine");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses premium dashboard surfaces for hero, command bar, and work panels", () => {
    expect(css).toContain(".topbar::before");
    expect(css).toContain(".controlStrip::before");
    expect(css).toContain(".panel::before");
    expect(css).toContain(".tablePanel");
  });
});
