import type { ModernPayload } from "@automovie/website/modern-scene";

/** Supplies one triangle with independently specified positions, normals, color and shadow flags for CPU mesh adapter assertions. No native renderer is acquired. */
export function modernItem(): ModernPayload["items"][number] {
  return {
    id: "part",
    role: "model",
    color: 0x803020,
    position: [2, 3, 4],
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
    castShadow: true,
    receiveShadow: false,
  };
}
