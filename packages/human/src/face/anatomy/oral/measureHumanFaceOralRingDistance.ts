import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";

/**
 * In-plane distance, in metres, from an arch-frame point `(u, v)` to the nearest cervical ring edge of the given stations.
 *
 * The distance is to ring segments and not ring vertices, so it is zero along a whole ring and continuous across it. Only the lateral and anterior coordinates enter; a ring's apical coordinate is the height the lining starts from and plays no part in where the lining lies.
 *
 * @evidence contracts/common.md#principled-implementation Projected nearest points on every cervical ring edge determine in-plane distance.
 * @evidence contracts/common.md#clear-and-simple-design Edge distance remains separate from the ring's local apical height used by the field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source tooth long axis or clinical CEJ is inferred, and empty station data would leave Infinity rather than a fabricated distance.
 * @evidence contracts/common.md#meaningful-documentation u/v and returned distance are arch-frame metres; apical coordinates do not participate.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in total cervical ring edges with constant temporaries.
 * @evidence contracts/performance.md#reuse-equivalent-work Field and sampled vault-span consumers share one edge-distance owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the scalar escapes and ring arrays remain caller-owned.
 */
export function measureHumanFaceOralRingDistance(
  stations: readonly IHumanFaceOralToothStation[],
  u: number,
  v: number,
): number {
  let nearest: number = Infinity;
  for (const station of stations) {
    const ring: number[] = station.cervical;
    const count: number = ring.length / 3;
    for (let k: number = 0; k < count; k++) {
      const next: number = (k + 1) % count;
      const ax: number = ring[3 * k];
      const ay: number = ring[3 * k + 1];
      const dx: number = ring[3 * next] - ax;
      const dy: number = ring[3 * next + 1] - ay;
      const squared: number = dx * dx + dy * dy;
      const t: number =
        squared === 0
          ? 0
          : Math.min(1, Math.max(0, ((u - ax) * dx + (v - ay) * dy) / squared));
      nearest = Math.min(nearest, Math.hypot(u - ax - t * dx, v - ay - t * dy));
    }
  }
  return nearest;
}
