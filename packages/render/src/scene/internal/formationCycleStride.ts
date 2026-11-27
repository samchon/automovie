import type * as THREE from "three";

/*
 * Estimate ground metres per baked cycle from the lowest part's trajectory.
 *
 * The lowest sampled part is used as a possible ground-contact proxy. Half its
 * closed horizontal path approximates a reciprocating sweep, and samples in its
 * lower half-height range approximate the contact fraction. Dividing that sweep
 * by the fraction estimates stride for this simple gait model.
 *
 * Arbitrary paths can circle, touch elsewhere or remain at low height without
 * contact; those cases need not satisfy the proxy. This is not a physical
 * no-slip/contact solver or an exact ground distance inferred from any figure.
 *
 * A track that never moves horizontally returns zero, and a figure with no
 * parts returns zero: nothing is carried anywhere, and the caller plays such a
 * cycle on its own declared period.
 */
export const formationCycleStride: (
  tracks: ReadonlyArray<readonly THREE.Vector3[]>,
) => number = (tracks: ReadonlyArray<readonly THREE.Vector3[]>): number => {
  let planted: readonly THREE.Vector3[] | null = null;
  let lowest: number = Number.POSITIVE_INFINITY;
  for (const track of tracks) {
    const bottom: number = Math.min(
      ...track.map((point: THREE.Vector3): number => point.y),
    );
    if (bottom >= lowest) continue;
    lowest = bottom;
    planted = track;
  }
  if (planted === null) return 0;
  const path: number = planted.reduce(
    (sum: number, point: THREE.Vector3, index: number): number => {
      const next: THREE.Vector3 = planted![(index + 1) % planted!.length]!;
      return sum + Math.hypot(next.x - point.x, next.z - point.z);
    },
    0,
  );
  if (path === 0) return 0;
  const heights: number[] = planted.map(
    (point: THREE.Vector3): number => point.y,
  );
  const middle: number = (Math.min(...heights) + Math.max(...heights)) / 2;
  const grounded: number =
    heights.filter((height: number): boolean => height <= middle).length /
    heights.length;
  return path / 2 / grounded;
};
