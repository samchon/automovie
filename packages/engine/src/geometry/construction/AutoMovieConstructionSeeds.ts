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
 * @evidence contracts/common.md#principled-implementation A search uses bounded Newton meeting solves on one fixed-phase part line from endpoint/interior-layer starts; an accepted residual and part-station share interval do not prove exhaustive intersection discovery or host-domain admission.
 * @evidence contracts/common.md#clear-and-simple-design Point conversion is direct; search preparation and candidate iteration delegate coarse foot initialization and the three-unknown meeting solve to local helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The phase stays fixed, but Newton iterates may leave the share interval on extended surfaces; only accepted part station is checked here, and final host-domain checks belong to tracing. A failed bounded search is not proof of no crossing.
 * @evidence contracts/common.md#meaningful-documentation States both seed kinds, the walk, its steps, the solve and the failure message.
 * @evidence contracts/performance.md#efficient-algorithms Candidates are the share endpoints and interior layers, each with at most two bounded foot attempts and one STEPS-bounded meeting solve; a cold failed first foot redundantly recomputes the same grid/start.
 * @evidence contracts/performance.md#reuse-equivalent-work A successful foot warm-starts the next candidate, while failed attempts can rebuild the coarse grid; no once-per-seed grid guarantee is made.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds O(L) interior/candidate station arrays plus local guesses/iterates for L layers; only a seed record or error string escapes and no cache is retained.
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
   *
   * Point mode converts chart lengths without checking a meeting. Search
   * mode is a finite local search; its existing "nowhere" failure wording
   * does not certify absence of every crossing on the requested interval.
   *
   * @evidence contracts/common.md#principled-implementation Converts point stations from metres to mm or tries fixed-phase Newton meetings from share endpoints/interior layers, accepting a residual within tolerance and a final part station within the requested interval.
   * @evidence contracts/common.md#clear-and-simple-design One seed-kind dispatch preserves direct point authoring while search owns candidate order, warm starts and the first accepted local meeting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Search admits distinct shares in [0,1] but does not constrain Newton iterates or check host domain here; downstream tracing checks domains. Exhausting these candidates is not an exhaustive no-intersection proof, despite the existing failure wording.
   * @evidence contracts/common.md#meaningful-documentation Gives metre input, mm surface/layer/tolerance units, candidate direction, point-mode meaning and the bounded-search failure limit.
   * @evidence contracts/performance.md#efficient-algorithms For M<=L+2 candidates, work is O(L) preparation plus bounded foot/40-step meeting costs per candidate and up to two 544-point coarse grids; the duplicated cold fallback is unresolved extra work.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the last successful foot as the next chart guess, but a failed cold attempt recomputes the same nearest grid before repeating its foot; no cross-request result/effect sharing occurs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Interior/ordered station arrays and current numerical jets have call lifetime; only the selected seed's chart scalars/face index or error string is returned.
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
    if (seed.type === "point")
      return {
        phi: seed.part[1],
        s: seed.part[0] * S,
        y: seed.host[0] * S,
        theta: seed.host[1],
        face,
      };
    if (
      !(
        seed.from >= 0 &&
        seed.from <= 1 &&
        seed.to >= 0 &&
        seed.to <= 1 &&
        seed.from !== seed.to
      )
    )
      return `search shares ${seed.from} and ${seed.to} must lie in [0, 1] and differ`;
    const first: number = layers[0]!;
    const last: number = layers[layers.length - 1]!;
    const a: number = first + seed.from * (last - first);
    const b: number = first + seed.to * (last - first);
    const low: number = Math.min(a, b);
    const high: number = Math.max(a, b);
    const inside: number[] = layers.filter(
      (s: number): boolean => s > low && s < high,
    );
    const steps: number[] =
      a < b ? [a, ...inside, b] : [a, ...inside.reverse(), b];

    let guess: [number, number] | null = null;
    for (const s of steps) {
      const p: Vec3 = part.jet(s, seed.phase).p;
      const start: [number, number] = guess ?? nearest(host, p);
      const foot: AutoMovieSolidFoot.IFoot | null =
        AutoMovieSolidFoot.of(host, p, start, tolerance) ??
        AutoMovieSolidFoot.of(host, p, nearest(host, p), tolerance);
      if (foot === null) continue;
      guess = [foot.u, foot.v];
      const met: Vec3 | null = meet(
        part,
        host,
        seed.phase,
        [s, foot.u, foot.v],
        tolerance,
      );
      if (met !== null && met[0] >= low && met[0] <= high)
        return { phi: seed.phase, s: met[0], y: met[1], theta: met[2], face };
    }
    return `the part's station line at phase ${seed.phase} meets the host nowhere between stations ${a} and ${b} mm`;
  }

  /** Newton's method on `P(s, phase) - H(y, theta) = 0`. */
  function meet(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidSurface,
    phase: number,
    x0: Vec3,
    tolerance: number,
  ): Vec3 | null {
    let x: Vec3 = [...x0];
    for (let k: number = 0; k < STEPS; k++) {
      const p: IAutoMovieSolidSurface.IJet = part.jet(x[0], phase);
      const h: IAutoMovieSolidSurface.IJet = host.jet(x[1], x[2]);
      const f: Vec3 = sub(p.p, h.p);
      if (norm(f) <= tolerance) return x;
      const dx: Vec3 | null = solve3(
        p.u,
        scale(h.u, -1),
        scale(h.v, -1),
        scale(f, -1),
      );
      if (dx === null || !dx.every(Number.isFinite)) return null;
      x = [x[0] + dx[0], x[1] + dx[1], x[2] + dx[2]];
    }
    return null;
  }

  /** The chart point of a coarse grid over the surface's domain nearest a world point. */
  function nearest(
    surface: IAutoMovieSolidSurface,
    p: Readonly<Vec3>,
  ): [number, number] {
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
