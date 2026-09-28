import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every corner of this layout has real UI (sidebar status pill bottom-left,
  // chat send button bottom-right) — the dev indicator collides wherever it
  // goes, so it's off. Compile/runtime errors still surface regardless.
  devIndicators: false,
};

export default nextConfig;
