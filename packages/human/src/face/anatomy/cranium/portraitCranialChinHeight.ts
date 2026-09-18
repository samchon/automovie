import { facialOval } from "./facialOval";

/**
 * Read the lowest point on this version's facial-oval boundary. Both trait
 * interpretation and cranial continuation use this same attachment datum;
 * a singled-out chin landmark cannot substitute for an asymmetric lower oval.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Resolves chin-relative cranial envelopes against the resident face boundary.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Shares the actual cranial attachment datum between control interpretation and construction.
 */
export function portraitCranialChinHeight(
  positions: readonly (readonly number[])[],
): number {
  const heights = facialOval.map((id) => positions[id]?.[1]);
  if (!heights.every(Number.isFinite))
    throw new Error("The cranial boundary requires finite resident heights.");
  return Math.min(...heights);
}
