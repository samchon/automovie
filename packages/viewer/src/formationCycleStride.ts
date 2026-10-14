import type * as THREE from "three";

/**
 * Estimate ground metres per baked cycle from the lowest part's trajectory.
 *
 * The lowest sampled part is used as a possible ground-contact proxy. Half
 * its closed horizontal path approximates a reciprocating sweep, and samples
 * in its lower half-height range approximate the contact fraction. Dividing
 * that sweep by the fraction estimates stride for this simple gait model.
 *
 * Arbitrary paths can circle, touch elsewhere or remain at low height without
 * contact; those cases need not satisfy the proxy. This is not a physical
 * no-slip/contact solver or an exact ground distance inferred from any figure.
 *
 * A track that never moves horizontally returns zero, and a figure with no
 * parts returns zero: nothing is carried anywhere, and the caller plays such a
 * cycle on its own declared period.
 *
 * @evidence contracts/common.md#principled-implementation Selects the first track with the lowest finite sampled height, measures its closed XZ path and divides half that path by lower-half-height occupancy; admitted finite periodic tracks are premises, with empty/horizontally still output zero and the lowest-part/contact/reciprocal-sweep model only a gait heuristic.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the bake-derived stride estimate beside its trajectory input rather than embedding gait-name stride constants or duplicating the engine's contact/constraint solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses measured positions and one explicitly disclosed height proxy uniformly across parts; no foot/hoof asset names, desired ground distances or hidden tolerances adjust the estimate.
 * @evidence contracts/common.md#meaningful-documentation States metre output, lowest-track selection, half-path/contact-fraction computation, zero cases and arbitrary-path/contact limitations instead of presenting a heuristic as exact physical identity.
 * @evidence contracts/performance.md#efficient-algorithms Scans all P tracks' S samples for lowest height and the chosen track for path/height fraction, O(P*S) dominant time and O(S) temporary heights; variadic min/max restrict extremely large custom sample counts, while current bake callers use the fixed modest sample population.
 * @evidence contracts/performance.md#reuse-equivalent-work Derives both path and contact proxy from the same selected baked track, reusing already sampled geometry without another pose solve; mutable trajectory input has no persistent cached equivalence key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows trajectory vectors and returns one scalar, retaining no tracks or native handles; temporary height arrays are released after the call and no worker/render task is acquired.
 */
export const formationCycleStride: (tracks: ReadonlyArray<readonly THREE.Vector3[]>) => number = (
  tracks: ReadonlyArray<readonly THREE.Vector3[]>,
): number => {
  let planted: readonly THREE.Vector3[] | null = null;
  let lowest: number = Number.POSITIVE_INFINITY;
  for (const track of tracks) {
    const bottom: number = Math.min(...track.map((point: THREE.Vector3): number => point.y));
    if (bottom >= lowest) continue;
    lowest = bottom;
    planted = track;
  }
  if (planted === null) return 0;
  const path: number = planted.reduce((sum: number, point: THREE.Vector3, index: number): number => {
    const next: THREE.Vector3 = planted![(index + 1) % planted!.length]!;
    return sum + Math.hypot(next.x - point.x, next.z - point.z);
  }, 0);
  if (path === 0) return 0;
  const heights: number[] = planted.map((point: THREE.Vector3): number => point.y);
  const middle: number = (Math.min(...heights) + Math.max(...heights)) / 2;
  const grounded: number =
    heights.filter((height: number): boolean => height <= middle).length / heights.length;
  return path / 2 / grounded;
};
