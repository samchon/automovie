import { HUMAN_FACE_LID_SEAT } from "@automovie/human/face/anatomy/eye/HUMAN_FACE_LID_SEAT";

/**
 * Include the medial join and the first posterior column at the shared bed reach.
 *
 * Actual three-dimensional source edge lengths determine the count. The
 * shared four-millimetre convention is discretized upward to a real column,
 * not treated as a measured caruncle dimension. Source and runtime seat owners
 * then use the actual endpoint arc length of this same count. A lid that has
 * no column beyond the bed before its lateral join refuses this registration.
 */
export function readHumanSourceMedialBedCount(
  positions: ArrayLike<number>,
  margin: readonly number[],
  columns: readonly number[],
): number {
  let arc = 0;
  for (let at = 1; at < columns.length - 1; at++) {
    const a = margin[columns[at - 1]], b = margin[columns[at]];
    arc += Math.hypot(positions[3 * b] - positions[3 * a],
      positions[3 * b + 1] - positions[3 * a + 1], positions[3 * b + 2] - positions[3 * a + 2]);
    if (!Number.isFinite(arc)) throw new Error("Medial bed has a nonfinite source arc.");
    if (arc >= HUMAN_FACE_LID_SEAT.medialBedMetres) return at + 1;
  }
  throw new Error("Medial bed has no source column at its shared reach before the lateral join.");
}
