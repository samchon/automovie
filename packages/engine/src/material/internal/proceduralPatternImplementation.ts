import type { IAutoMovieProceduralSurface } from "@automovie/interface";

import { proceduralCellsImplementation } from "./proceduralCellsImplementation";
import { proceduralFractalImplementation } from "./proceduralFractalImplementation";
import { proceduralFrameImplementation } from "./proceduralFrameImplementation";
import { proceduralHashImplementation } from "./proceduralHashImplementation";

/*
 * A procedural surface's pattern value within [0, 1] at a point of its sampling
 * space, in metres.
 *
 * With `s = scale`, `n(q) = 0.5 + 0.5 × proceduralFractalImplementation(seed, q)`
 * and the axis frame of `proceduralFrameImplementation`:
 *
 * - Plaster and clay: `n(p / s)`;
 * - Stone: `0.75 × clamp(f2 − f1, 0, 1) + 0.25 × n(p / s)`, with the cellular
 *   distances of `proceduralCellsImplementation` at `p / s`, so joints between
 *   stones (`f2 = f1`) are darkest, three parts cells to one part noise;
 * - Wood: `0.5 − 0.5 cos(2π r' / s)` with `r'` the distance from the axis line
 *   through the origin plus `0.3 × s × fractal(p / 4s)`, so ring `m` peaks at
 *   radius `(m + 0.5) s` and the rings wander over about four ring spacings
 *   (Peachey 1985);
 * - Fabric: the higher of the warp and weft thread surfaces. With `a` and `b` the
 *   point's coordinates along and across the axis over `s`, warp thread `i =
 *   ⌊b⌋` has surface `sin²(π frac b) × (0.5 + 0.5 (−1)^i sin(π a))` and weft
 *   thread `j = ⌊a⌋` has `sin²(π frac a) × (0.5 − 0.5 (−1)^j sin(π b))`, so
 *   warp `i` passes over weft `j` where `i + j` is even and under it elsewhere.
 *   Each thread's surface is scaled by `0.8 + 0.2 × jitter`, with jitter the
 *   first word of `proceduralHashImplementation(seed, 32, i, 0, 0)` for a warp and
 *   `(seed, 33, j, 0, 0)` for a weft over 2³². Every term reaches zero where
 *   its thread index changes, so the value is continuous;
 * - Brushed metal: `n` at `(along / s, 100 × across / s, 100 × normal / s)`, the
 *   noise stretched 100 times along the axis.
 *
 * The 0.75 and 0.25 stone weights, the four-spacing wood wander and the 0.8 to
 * 1 thread jitter are this contract's fixed definitions of the kinds, not
 * fitted values. The renderer evaluates the same expressions.
 * Parameter surface: The admitted surface.
 * Parameter point: The sample point in its sampling space, metres.
 * Returns: The pattern value.
 */
export function proceduralPatternImplementation(
  surface: IAutoMovieProceduralSurface,
  point: readonly [number, number, number],
): number {
  const s: number = surface.scale;
  const seed: number = surface.seed;
  const [x, y, z]: readonly [number, number, number] = point;
  const noise: (qx: number, qy: number, qz: number) => number = (
    qx: number,
    qy: number,
    qz: number,
  ): number => 0.5 + 0.5 * proceduralFractalImplementation(seed, qx, qy, qz);

  // The axis frame, read only by the directional kinds.
  const axes: () => [number, number, number] = (): [number, number, number] => {
    const frame: ReturnType<typeof proceduralFrameImplementation> =
      proceduralFrameImplementation(surface.axis!);
    const dot: (v: [number, number, number]) => number = (
      v: [number, number, number],
    ): number => v[0] * x + v[1] * y + v[2] * z;
    return [dot(frame.along), dot(frame.across), dot(frame.normal)];
  };
  switch (surface.kind) {
    case "plaster":
    case "clay":
      return clamp01(noise(x / s, y / s, z / s));
    case "stone": {
      const [f1, f2]: [number, number] = proceduralCellsImplementation(
        seed,
        x / s,
        y / s,
        z / s,
      );
      return clamp01(
        0.75 * clamp01(f2 - f1) + 0.25 * noise(x / s, y / s, z / s),
      );
    }
    case "wood": {
      const [, across, normal]: [number, number, number] = axes();
      const radius: number =
        Math.hypot(across, normal) +
        0.3 *
          s *
          proceduralFractalImplementation(
            seed,
            x / (4 * s),
            y / (4 * s),
            z / (4 * s),
          );
      return clamp01(0.5 - 0.5 * Math.cos((2 * Math.PI * radius) / s));
    }
    case "fabric": {
      const [along, across]: [number, number, number] = axes();
      const a: number = along / s;
      const b: number = across / s;
      const i: number = Math.floor(b);
      const j: number = Math.floor(a);
      const warpSign: number = (i & 1) === 0 ? 1 : -1;
      const weftSign: number = (j & 1) === 0 ? 1 : -1;
      const warp: number =
        Math.sin(Math.PI * (b - i)) ** 2 *
        (0.5 + 0.5 * warpSign * Math.sin(Math.PI * a)) *
        (0.8 +
          (0.2 * proceduralHashImplementation(seed, 32, i, 0, 0)[0]) / 4294967296);
      const weft: number =
        Math.sin(Math.PI * (a - j)) ** 2 *
        (0.5 - 0.5 * weftSign * Math.sin(Math.PI * b)) *
        (0.8 +
          (0.2 * proceduralHashImplementation(seed, 33, j, 0, 0)[0]) / 4294967296);
      return clamp01(Math.max(warp, weft));
    }
    case "brushedMetal": {
      const [along, across, normal]: [number, number, number] = axes();
      return clamp01(noise(along / s, (100 * across) / s, (100 * normal) / s));
    }
  }
}
/*
 * The value clamped to [0, 1].
 */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
