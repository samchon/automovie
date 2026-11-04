import type { AutoMovieHumanSolidIntersection } from "./AutoMovieHumanSolidIntersection";
import { AutoMovieHumanSolidVector } from "./AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "./IAutoMovieHumanSolidSurface";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
type IJet = IAutoMovieHumanSolidSurface.IJet;
const { combine, cross, dot, norm, sub, unit } = AutoMovieHumanSolidVector;

/**
 * The two rails a blend runs between, at one point of the intersection curve:
 * where each surface is trimmed back from the curve on its kept side.
 *
 * Square offsets. A rail leaves the curve's preimage square to it in its
 * surface's first fundamental form `G`: with the preimage's chart tangent
 * `c' = (u', v')`, the direction `e = G^-1 (-v', u')` satisfies `c'^T G e = 0`,
 * so `S_* e` is perpendicular on the skin to the curve's tangent (the
 * squaring of `AutoMovieHumanSeam.square`), whatever the chart's units. The
 * host's rail always leaves so. The part's rail does under the `square`
 * mode (a part traced by the angle about its footprint, lying along its
 * host); under the `station` mode (a part traced by its phase) it stays on the
 * part's own station line through the curve point, so the part's columns
 * stay its own phases and the part is only shortened: `s_A = s* + sigma lambda`,
 * `sigma` the sign of the part's kept side.
 *
 * Each offset is solved so that the rail lies the requested chord from the
 * curve point: `|S(c + lambda e) - C| = w` by Newton's method on `lambda`, so
 * a width law reads in millimetres of skin, not of chart.
 *
 * Kept sides: a merge keeps the part outside the host and the host outside the
 * part; a diff keeps the cutter inside the base and the base outside the
 * cutter. A part's kept side is the sign of its offset direction against the
 * host's outward normal (turned for `inside`); the host's is the sign of
 * `S_* e` against the part's outward normal. Both need the surfaces to cross,
 * not touch: where a direction lies in the other's tangent plane no rail
 * exists and null returns.
 */
export namespace AutoMovieHumanSolidRail {
  /** The rails at one curve point. */
  export interface IRail {
    /** The curve point the rails are read from. */
    curve: AutoMovieHumanSolidIntersection.IPoint;

    /** The part's rail station. */
    s: number;

    /** The part's rail phase: the curve's own under the `station` mode. */
    phi: number;

    /** Sign of the part's kept side in its station, +1 or -1 (under the `square` mode, the sign of `partAcross`'s station part). */
    sigma: number;

    /** The part's offset direction in its chart, from the curve's preimage toward its rail, the chart vector of unit world speed at the preimage. */
    partAcross: [number, number];

    /** The part's rail point, mm. */
    partPoint: Vec3;

    /** The host's rail chart point `[y, theta]`. */
    host: [number, number];

    /** The host's offset direction in its chart, from the curve's preimage toward the rail, the chart vector of unit world speed. */
    across: [number, number];

    /** The host's rail point, mm. */
    hostPoint: Vec3;
  }

  /** Which side of the host the part keeps. */
  export type Keep = "outside" | "inside";

  /** How the part's rail leaves the curve: along its station line, or square to the curve in its chart. */
  export type Mode = "station" | "square";

  /** Newton steps of one offset. */
  export const STEPS: number = 40;

  /**
   * The rails at a curve point.
   *
   * @param part The attached part.
   * @param host The host.
   * @param curve The curve point with its preimages and their rates.
   * @param keep Which side of the host the part keeps: `outside` for a merge, `inside` for a diff.
   * @param partWidth Chord from the curve to the part's rail, mm, positive; or
   *   `{ station }` under the `station` mode, the part's rail at one station
   *   for every phase (a chain's first own section, which must lie on the kept
   *   side of the curve there).
   * @param hostWidth Chord from the curve to the host's rail, mm, positive.
   * @param mode How the part's rail leaves the curve; absent, `station`.
   * @returns The rails, or null where a kept side is undefined (the surfaces
   *   touch) or an offset's Newton solve fails.
   */
  export function at(
    part: IAutoMovieHumanSolidSurface,
    host: IAutoMovieHumanSolidSurface,
    curve: AutoMovieHumanSolidIntersection.IPoint,
    keep: Keep,
    partWidth: number | { station: number },
    hostWidth: number,
    mode: Mode = "station",
  ): IRail | null {
    const a: IJet = part.jet(curve.s, curve.phi);
    const b: IJet = host.jet(curve.y, curve.theta);
    const outA: Vec3 | null = unit(cross(a.u, a.v));
    const outB: Vec3 | null = unit(cross(b.u, b.v));
    if (outA === null || outB === null) return null;
    const nA: Vec3 = [outA[0] * part.orientation, outA[1] * part.orientation, outA[2] * part.orientation];
    const nB: Vec3 = [outB[0] * host.orientation, outB[1] * host.orientation, outB[2] * host.orientation];

    // The part's kept side: along its station, or square to the curve.
    let s: number;
    let phi: number = curve.phi;
    let partAcross: [number, number];
    let sigma: number;
    if (mode === "station") {
      const facing: number = dot(a.u, nB);
      if (!(Math.abs(facing) > 0)) return null;
      const side: number = (facing > 0) === (keep === "outside") ? 1 : -1;
      sigma = side;
      partAcross = [side / norm(a.u), 0];
      if (typeof partWidth === "number") {
        const lambda: number | null = offset((l: number): IJet => part.jet(curve.s + side * l, curve.phi), [1, 0], curve.point, partWidth);
        if (lambda === null) return null;
        s = curve.s + side * lambda;
      } else {
        if (!(side * (partWidth.station - curve.s) > 0)) return null;
        s = partWidth.station;
      }
    } else {
      if (typeof partWidth !== "number") return null;
      const e: [number, number] | null = square(a, [curve.rate[0], curve.rate[1]], nB, keep === "outside" ? 1 : -1);
      if (e === null) return null;
      partAcross = e;
      sigma = e[0] >= 0 ? 1 : -1;
      const lambda: number | null = offset((l: number): IJet => part.jet(curve.s + l * e[0], curve.phi + l * e[1]), e, curve.point, partWidth);
      if (lambda === null) return null;
      s = curve.s + lambda * e[0];
      phi = curve.phi + lambda * e[1];
    }

    // The host's direction square to the preimage, turned toward the
    // outside of the part.
    const across: [number, number] | null = square(b, [curve.rate[2], curve.rate[3]], nA, 1);
    if (across === null) return null;
    const mu: number | null = offset((l: number): IJet => host.jet(curve.y + l * across[0], curve.theta + l * across[1]), across, curve.point, hostWidth);
    if (mu === null) return null;
    const hostChart: [number, number] = [curve.y + mu * across[0], curve.theta + mu * across[1]];

    return {
      curve,
      s,
      phi,
      sigma,
      partAcross,
      partPoint: part.jet(s, phi).p,
      host: hostChart,
      across,
      hostPoint: host.jet(hostChart[0], hostChart[1]).p,
    };
  }

  /**
   * The chart direction square to a preimage's tangent in the surface's
   * first fundamental form, of unit world speed, turned so that its image
   * faces `toward` with the sign `side`.
   *
   * @param j The surface's jet at the preimage.
   * @param tangent The preimage's chart tangent `(u', v')`.
   * @param toward A world direction, such as the other surface's outward normal.
   * @param side 1 to face along `toward`, -1 against it.
   * @returns The direction, or null where the tangent vanishes or the image lies square to `toward`.
   */
  function square(j: IJet, tangent: readonly [number, number], toward: Readonly<Vec3>, side: number): [number, number] | null {
    const E: number = dot(j.u, j.u);
    const F: number = dot(j.u, j.v);
    const G: number = dot(j.v, j.v);
    const e: [number, number] | null = AutoMovieHumanSolidVector.solve2(E, F, F, G, [-tangent[1], tangent[0]]);
    if (e === null) return null;
    const speed: number = Math.sqrt(E * e[0] * e[0] + 2 * F * e[0] * e[1] + G * e[1] * e[1]);
    if (!(speed > 0)) return null;
    const out: number = dot(
      combine([
        [e[0], j.u],
        [e[1], j.v],
      ]),
      toward,
    );
    if (!(Math.abs(out) > 0)) return null;
    const turn: number = ((out > 0 ? 1 : -1) * side) / speed;
    return [e[0] * turn, e[1] * turn];
  }

  /**
   * The chart distance along a direction at which the surface stands a chord
   * from a point, by Newton's method from the first-order guess `w / |S_d|`.
   *
   * @param along The surface's jet at chart distance `l` along the direction.
   * @param d The chart direction.
   * @param from The point the chord is measured from, mm.
   * @param width The chord, mm, positive.
   * @returns The chart distance, or null when the solve fails or the width is not positive.
   */
  function offset(along: (l: number) => IJet, d: readonly [number, number], from: Readonly<Vec3>, width: number): number | null {
    if (!(width > 0)) return null;
    const j0: IJet = along(0);
    const speed: number = norm(combine([
      [d[0], j0.u],
      [d[1], j0.v],
    ]));
    if (!(speed > 0)) return null;
    let l: number = width / speed;
    for (let step: number = 0; step < STEPS; step++) {
      const j: IJet = along(l);
      const r: Vec3 = sub(j.p, from);
      const chord: number = norm(r);
      const miss: number = chord - width;
      const rate: number = dot(r, combine([
        [d[0], j.u],
        [d[1], j.v],
      ])) / chord;
      if (!(rate > 0)) return null;

      // Converged: one last step takes the miss from the tolerance to
      // rounding, so neighbouring rail points carry no solver noise.
      const converged: boolean = Math.abs(miss) <= 1e-12 * width;
      l -= miss / rate;
      if (converged) return l;
    }
    return null;
  }
}
