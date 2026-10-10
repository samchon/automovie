import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";

/**
 * In-plane distance, in metres, from an arch-frame point `(u, v)` to the
 * nearest cervical ring edge of the given stations.
 *
 * The distance is to ring segments and not ring vertices, so it is zero
 * along a whole ring and continuous across it. Only the lateral and anterior
 * coordinates enter; a ring's apical coordinate is the height the lining
 * starts from and plays no part in where the lining lies.
 */
export function measureHumanFaceOralRingDistance(
  stations: readonly IHumanFaceOralToothStation[],
  u: number,
  v: number,
): number {
  let nearest = Infinity;
  for (const station of stations) {
    const ring = station.cervical;
    const count = ring.length / 3;
    for (let k = 0; k < count; k++) {
      const next = (k + 1) % count;
      const ax = ring[3 * k];
      const ay = ring[3 * k + 1];
      const dx = ring[3 * next] - ax;
      const dy = ring[3 * next + 1] - ay;
      const squared = dx * dx + dy * dy;
      const t =
        squared === 0
          ? 0
          : Math.min(1, Math.max(0, ((u - ax) * dx + (v - ay) * dy) / squared));
      nearest = Math.min(nearest, Math.hypot(u - ax - t * dx, v - ay - t * dy));
    }
  }
  return nearest;
}
