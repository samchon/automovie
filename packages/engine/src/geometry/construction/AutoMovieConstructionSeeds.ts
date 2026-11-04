import type { AutoMovieConstructionSeed } from "@automovie/interface";

import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieSolidFoot } from "./AutoMovieSolidFoot";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { norm, scale, solve3, sub } = AutoMovieSolidVector;

/**
 * A join's seed record as the trace's seed (`AutoMovieSolidIntersection.IInput.seed`), in millimetres.
 *
 * A point seed is its two chart points. A search seed walks the part face's station line at its phase between its two shares, one step per span between the part chain's consecutive stations, takes each step's foot on the host face and solves the meeting `P(s, phase) = H(y, theta)` for `(s, y, theta)` by Newton's method from it; the first meeting whose station lies between the shares is the seed.
 *
 * @evidence contracts/common.md#principled-implementation A search seed is the crossing of one station line of the part with the host, a three-unknown meeting solved by Newton from each step's foot, so the seed lies on the true intersection whatever stations the loft produced.
 * @evidence contracts/common.md#clear-and-simple-design A point seed maps directly; a search walks the stated shares at the chain's own layer stations, one foot and one Newton solve per step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The search stays on the stated station line between the stated shares and reports a miss; it never scans the whole surface or falls back to a point.
 * @evidence contracts/common.md#meaningful-documentation States both seed kinds, the walk, its steps, the solve and the failure message.
 * @evidence contracts/performance.md#efficient-algorithms Steps equal the chain's layers in the range; each step costs one foot (with a coarse grid start only when no earlier foot exists) and at most STEPS Newton iterations.
 * @evidence contracts/performance.md#reuse-equivalent-work Each step's foot starts from the previous step's foot, so the grid search runs once per seed in the usual case.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps one guess and one iterate; returns the seed and retains nothing.
 */
export namespace AutoMovieConstructionSeeds {
  /** Newton steps of one meeting solve. */
  export const STEPS: number = 40;

  /** Stations and phases of the coarse grid a step's first foot starts from. */
  export const GRID: [number, number] = [16, 32];

  /**
   * The trace's seed.
   *
   * @param seed The seed record, metres.
   * @param part The part face's surface.
   * @param layers The part chain's layer stations, mm, increasing.
   * @param host The host face's surface.
   * @param face The host face's index in the host atlas.
   * @param tolerance Largest gap accepted at the meeting, mm.
   * @returns The seed, or the premise the search broke.
   */
  export function create(
    seed: AutoMovieConstructionSeed,
    part: IAutoMovieSolidSurface,
    layers: readonly number[],
    host: IAutoMovieSolidSurface,
    face: number,
    tolerance: number,
  ): AutoMovieSolidIntersection.IInput["seed"] | string {
    const S: number = AutoMovieConstructionViews.SCALE;
    if (seed.type === "point") return { phi: seed.part[1], s: seed.part[0] * S, y: seed.host[0] * S, theta: seed.host[1], face };
    if (!(seed.from >= 0 && seed.from <= 1 && seed.to >= 0 && seed.to <= 1 && seed.from !== seed.to)) return `search shares ${seed.from} and ${seed.to} must lie in [0, 1] and differ`;
    const first: number = layers[0]!;
    const last: number = layers[layers.length - 1]!;
    const a: number = first + seed.from * (last - first);
    const b: number = first + seed.to * (last - first);
    const low: number = Math.min(a, b);
    const high: number = Math.max(a, b);
    const inside: number[] = layers.filter((s: number): boolean => s > low && s < high);
    const steps: number[] = a < b ? [a, ...inside, b] : [a, ...inside.reverse(), b];

    let guess: [number, number] | null = null;
    for (const s of steps) {
      const p: Vec3 = part.jet(s, seed.phase).p;
      const start: [number, number] = guess ?? nearest(host, p);
      const foot: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(host, p, start, tolerance) ?? AutoMovieSolidFoot.of(host, p, nearest(host, p), tolerance);
      if (foot === null) continue;
      guess = [foot.u, foot.v];
      const met: Vec3 | null = meet(part, host, seed.phase, [s, foot.u, foot.v], tolerance);
      if (met !== null && met[0] >= low && met[0] <= high) return { phi: seed.phase, s: met[0], y: met[1], theta: met[2], face };
    }
    return `the part's station line at phase ${seed.phase} meets the host nowhere between stations ${a} and ${b} mm`;
  }

  /** Newton's method on `P(s, phase) - H(y, theta) = 0`. */
  function meet(part: IAutoMovieSolidSurface, host: IAutoMovieSolidSurface, phase: number, x0: Vec3, tolerance: number): Vec3 | null {
    let x: Vec3 = [...x0];
    for (let k: number = 0; k < STEPS; k++) {
      const p: IAutoMovieSolidSurface.IJet = part.jet(x[0], phase);
      const h: IAutoMovieSolidSurface.IJet = host.jet(x[1], x[2]);
      const f: Vec3 = sub(p.p, h.p);
      if (norm(f) <= tolerance) return x;
      const dx: Vec3 | null = solve3(p.u, scale(h.u, -1), scale(h.v, -1), scale(f, -1));
      if (dx === null || !dx.every(Number.isFinite)) return null;
      x = [x[0] + dx[0], x[1] + dx[1], x[2] + dx[2]];
    }
    return null;
  }

  /** The chart point of a coarse grid over the surface's domain nearest a world point. */
  function nearest(surface: IAutoMovieSolidSurface, p: Readonly<Vec3>): [number, number] {
    const [u0, u1]: [number, number] = surface.domain ?? [0, 1];
    const period: number = surface.period ?? 1;
    let best: [number, number] = [u0, 0];
    let distance: number = Infinity;
    for (let i: number = 0; i <= GRID[0]; i++)
      for (let j: number = 0; j < GRID[1]; j++) {
        const u: number = u0 + ((u1 - u0) * i) / GRID[0];
        const v: number = (period * j) / GRID[1];
        const d: number = norm(sub(surface.jet(u, v).p, p));
        if (d < distance) {
          distance = d;
          best = [u, v];
        }
      }
    return best;
  }
}
