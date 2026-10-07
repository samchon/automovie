import type * as THREE from "three";

/**
 * Ground meters one baked cycle carries a body, measured from the bake itself.
 *
 * The part that reaches lowest through the cycle is the one that meets the
 * ground: a foot, a hoof, a paw, whatever the figure happens to stand on. While
 * that part is planted the ground runs backwards under it at exactly the speed
 * the body runs forwards, so the sweep it makes is the ground the body covers
 * over the part of the cycle it is planted for, and the whole cycle covers that
 * sweep divided by that fraction.
 *
 * Both quantities come out of the track rather than out of a declaration. The
 * closed horizontal path is twice the sweep, since the part returns to where it
 * started. The planted fraction is how much of the cycle the part spends in the
 * lower half of its own rise, which is a statement about a figure standing on
 * the ground rather than about any rig's axis convention or joint sign.
 *
 * A track that never moves horizontally returns zero, and a figure with no
 * parts returns zero: nothing is carried anywhere, and the caller plays such a
 * cycle on its own declared period.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
 */
export const formationCycleStride = (
  tracks: ReadonlyArray<readonly THREE.Vector3[]>,
): number => {
  let planted: readonly THREE.Vector3[] | null = null;
  let lowest = Number.POSITIVE_INFINITY;
  for (const track of tracks) {
    const bottom = Math.min(...track.map((point) => point.y));
    if (bottom >= lowest) continue;
    lowest = bottom;
    planted = track;
  }
  if (planted === null) return 0;
  const path = planted.reduce((sum, point, index) => {
    const next = planted![(index + 1) % planted!.length]!;
    return sum + Math.hypot(next.x - point.x, next.z - point.z);
  }, 0);
  if (path === 0) return 0;
  const heights = planted.map((point) => point.y);
  const middle = (Math.min(...heights) + Math.max(...heights)) / 2;
  const grounded =
    heights.filter((height) => height <= middle).length / heights.length;
  return path / 2 / grounded;
};
