import { portraitFacialOvalVertices } from "./portraitFacialOvalVertices";

/**
 * Read the lowest point on the facial-oval boundary. Both trait
 * interpretation and cranial continuation use this same attachment datum;
 * a singled-out chin landmark cannot substitute for an asymmetric lower oval.
 */
export function portraitCranialChinHeight(
  positions: readonly (readonly number[])[],
): number {
  const heights = portraitFacialOvalVertices.map((id) => positions[id]?.[1]);
  if (!heights.every(Number.isFinite))
    throw new Error("The cranial boundary requires finite resident heights.");
  return Math.min(...heights);
}
