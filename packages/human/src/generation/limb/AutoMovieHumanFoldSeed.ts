import { AutoMovieHumanSolidFoot } from "../../lofting/AutoMovieHumanSolidFoot";
import { AutoMovieHumanSolidVector } from "../../lofting/AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "../../lofting/IAutoMovieHumanSolidSurface";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
const { cross, dot, scale, sub, unit } = AutoMovieHumanSolidVector;

/**
 * A fold join's seed where a part's station line crosses its host's skin: a
 * point on both surfaces near their intersection curve, with its chart
 * points on each (`AutoMovieHumanFoldJoin.IInput.landmark` and `guess`).
 *
 * Along one phase of the part, from its station inside the host to its
 * station outside, each station's point is placed against the host by its
 * foot on the host (`AutoMovieHumanSolidFoot`, warm-started from the previous
 * station's foot) and the sign of its offset along the host's outward
 * normal there: negative inside, positive outside. The first sign change is
 * refined by bisection to the tolerance, so the seed is the station line's
 * crossing of the host's surface, a point of the intersection curve itself.
 * Only the two surfaces' parametric evaluations are read: no mesh, no ray.
 *
 * Premise: the line starts inside the host and leaves it (rule 8 of the body
 * lane: every part runs into its host past the contact); a line that never
 * leaves, or whose foot is lost, gives no seed.
 */
export namespace AutoMovieHumanFoldSeed {
  /** A seed. */
  export interface ISeed {
    /** The crossing point, mm. */
    landmark: Vec3;

    /** Its chart points on the part and on the host. */
    guess: { part: [number, number]; host: [number, number] };
  }

  /** Stations sampled along the line before the crossing is bisected. */
  const SAMPLES: number = 64;

  /** Bisections of the bracketing interval. */
  const BISECTIONS: number = 50;

  /**
   * The seed on one phase of the part.
   *
   * @param part The part.
   * @param host The host.
   * @param phi The part's phase to search along.
   * @param from The part's station inside the host.
   * @param to The part's station outside it.
   * @param guess The host's chart guess for the foot at `from`.
   * @param tolerance Largest tangential residual of a foot, mm.
   * @returns The seed, or null when the line does not leave the host or a foot is lost.
   */
  export function of(
    part: IAutoMovieHumanSolidSurface,
    host: IAutoMovieHumanSolidSurface,
    phi: number,
    from: number,
    to: number,
    guess: [number, number],
    tolerance: number,
  ): ISeed | null {
    let chart: [number, number] = guess;
    const side = (s: number): { sign: number; foot: AutoMovieHumanSolidFoot.IFoot; point: Vec3 } | null => {
      const point: Vec3 = part.jet(s, phi).p as Vec3;
      const foot: AutoMovieHumanSolidFoot.IFoot | null = AutoMovieHumanSolidFoot.of(host, point, chart, tolerance);
      if (foot === null) return null;
      const j: ReturnType<IAutoMovieHumanSolidSurface["jet"]> = host.jet(foot.u, foot.v);
      const n: Vec3 | null = unit(cross(j.u, j.v));
      if (n === null) return null;
      chart = [foot.u, foot.v];
      return { sign: Math.sign(dot(sub(point, foot.point as Vec3), scale(n, host.orientation))), foot, point };
    };

    let a: number = from;
    const start: { sign: number; foot: AutoMovieHumanSolidFoot.IFoot; point: Vec3 } | null = side(a);
    if (start === null || start.sign > 0) return null;
    for (let k: number = 1; k <= SAMPLES; k++) {
      const b: number = from + ((to - from) * k) / SAMPLES;
      const at: { sign: number; foot: AutoMovieHumanSolidFoot.IFoot; point: Vec3 } | null = side(b);
      if (at === null) return null;
      if (at.sign > 0) {
        // Bisect the bracket [a, b] to the crossing.
        let lo: number = a;
        let hi: number = b;
        let last: { sign: number; foot: AutoMovieHumanSolidFoot.IFoot; point: Vec3 } = at;
        for (let i: number = 0; i < BISECTIONS; i++) {
          const m: number = (lo + hi) / 2;
          const mid: { sign: number; foot: AutoMovieHumanSolidFoot.IFoot; point: Vec3 } | null = side(m);
          if (mid === null) return null;
          if (mid.sign > 0) {
            hi = m;
            last = mid;
          } else lo = m;
        }
        return { landmark: last.point, guess: { part: [hi, phi], host: [last.foot.u, last.foot.v] } };
      }
      a = b;
    }
    return null;
  }
}
