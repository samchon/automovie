import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSurfaceCage,
  sampleAutoMovieSurfaceNetwork,
  subdivideAutoMovieSurface,
} from "@automovie/engine";

import { sweepTransitionTube } from "./sweepTransitionTube";

/**
 * Measure how far the straight transition tube's limit surface departs from
 * its cylinder at one tier, away from its open ends.
 *
 * The cage is subdivided twice and every limit point between 0.01 m and
 * 0.59 m up the `y` axis is compared with the 0.05 m radius, and every
 * subdivided face's normal with the radial direction through its centre.
 *
 * @param tier The tier to sample.
 * @returns The largest radial deviation over the radius, and the largest normal angle in degrees.
 */
export function sweepTransitionDeviation(
  tier: AutoMovieSurfaceTier,
): [number, number] {
  const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: sweepTransitionTube({ bow: 0 }),
    tier,
  });
  const surface = subdivideAutoMovieSurface({
    cage: { positions: cage.cage.positions, faces: cage.cage.faces },
    levels: 2,
  });
  const p: ArrayLike<number> = surface.limitPositions;
  const inside = (y: number): boolean => y >= 0.01 && y <= 0.59;
  let radial: number = 0;
  for (let i: number = 0; i < p.length / 3; ++i)
    if (inside(p[3 * i + 1]!))
      radial = Math.max(
        radial,
        Math.abs(Math.hypot(p[3 * i]!, p[3 * i + 2]!) - 0.05) / 0.05,
      );
  let normal: number = 0;
  for (let f: number = 0; f < surface.faces.length / 4; ++f) {
    const at = (k: number, axis: number): number =>
      p[3 * surface.faces[4 * f + k]! + axis]!;
    const centre: number[] = [0, 1, 2].map(
      (axis: number): number =>
        (at(0, axis) + at(1, axis) + at(2, axis) + at(3, axis)) / 4,
    );
    if (!inside(centre[1]!)) continue;
    const d1: number[] = [0, 1, 2].map(
      (axis: number): number => at(2, axis) - at(0, axis),
    );
    const d2: number[] = [0, 1, 2].map(
      (axis: number): number => at(3, axis) - at(1, axis),
    );
    const n: number[] = [
      d1[1]! * d2[2]! - d1[2]! * d2[1]!,
      d1[2]! * d2[0]! - d1[0]! * d2[2]!,
      d1[0]! * d2[1]! - d1[1]! * d2[0]!,
    ];
    const cos: number =
      (n[0]! * centre[0]! + n[2]! * centre[2]!) /
      (Math.hypot(n[0]!, n[1]!, n[2]!) * Math.hypot(centre[0]!, centre[2]!));
    normal = Math.max(normal, (Math.acos(Math.min(1, cos)) * 180) / Math.PI);
  }
  return [radial, normal];
}
