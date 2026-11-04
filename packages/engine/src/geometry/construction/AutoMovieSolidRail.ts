import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type IJet = IAutoMovieSolidSurface.IJet;
const { combine, cross, dot, norm, sub, unit } = AutoMovieSolidVector;

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
 * Each square offset then settles in the normal section: the rail point is
 * where the surface meets the plane through the curve point spanned by the
 * surface's normal and `S_* e` at the preimage, at the requested chord `w`
 * from the curve point (a straight chart line from the preimage first, then
 * Newton on the plane and the chord). So a width law reads in millimetres of
 * skin, and the rail depends on the surfaces and the curve alone, not on how
 * a chart is drawn; on a plane the section is the straight chart line.
 *
 * Kept sides: a merge keeps the part outside the host and the host outside the
 * part; a diff keeps the cutter inside the base and the base outside the
 * cutter. A part's kept side is the sign of its offset direction against the
 * host's outward normal (turned for `inside`); the host's is the sign of
 * `S_* e` against the part's outward normal. Both need the surfaces to cross,
 * not touch: where a direction lies in the other's tangent plane no rail
 * exists and null returns.
 */
export namespace AutoMovieSolidRail {
  /** The rails at one curve point. */
  export interface IRail {
    /** The curve point the rails are read from. */
    curve: AutoMovieSolidIntersection.IPoint;

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

    /** The host face its rail lies on (`IAutoMovieSolidAtlas`); the curve's own face unless the offset crossed a trim. */
    hostFace: number;

    /** The host's rail chart point `[y, theta]` on that face. */
    host: [number, number];

    /** The host's offset direction in its rail face's chart, toward and past the rail, the chart vector of unit world speed (at the preimage, or at the last crossing). */
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

  /** Relative residual a rail solve accepts, of the chord plus the curve point's distance from the origin: rounding grows with the coordinates, so a sub-millimetre chord far from the origin converges as a large one does. */
  export const ROUNDING: number = 1e-12;

  /** Faces one host rail may cross before it is refused. */
  export const SWITCHES: number = 4;

  /** Halvings that place an offset's crossing of a trim, to `2^-40` of the offset. */
  export const CROSSING_BISECTIONS: number = 40;

  /**
   * The rails at a curve point.
   *
   * @param part The attached part.
   * @param host The host as an atlas (`AutoMovieSolidIntersection.atlas` for one surface).
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
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    curve: AutoMovieSolidIntersection.IPoint,
    keep: Keep,
    partWidth: number | { station: number },
    hostWidth: number,
    mode: Mode = "station",
  ): IRail | null {
    const a: IJet = part.jet(curve.s, curve.phi);
    const surface: IAutoMovieSolidSurface = host.faces[curve.face]!;
    const b: IJet = surface.jet(curve.y, curve.theta);
    const outA: Vec3 | null = unit(cross(a.u, a.v));
    const outB: Vec3 | null = unit(cross(b.u, b.v));
    if (outA === null || outB === null) return null;
    const nA: Vec3 = [outA[0] * part.orientation, outA[1] * part.orientation, outA[2] * part.orientation];
    const nB: Vec3 = [outB[0] * surface.orientation, outB[1] * surface.orientation, outB[2] * surface.orientation];

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
        const lambda: number | null = offset((l: number): IJet => part.jet(curve.s + side * l, curve.phi), [side, 0], curve.point, partWidth);
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
      const refined: [number, number] | null = section(part, [curve.s + lambda * e[0], curve.phi + lambda * e[1]], curve.point, plane(a, e), partWidth);
      if (refined === null) return null;
      s = refined[0];
      phi = refined[1];
    }

    // The host's direction square to the preimage, turned toward the
    // outside of the part.
    const across: [number, number] | null = square(b, [curve.rate[2], curve.rate[3]], nA, 1);
    if (across === null) return null;
    const mu: number | null = offset((l: number): IJet => surface.jet(curve.y + l * across[0], curve.theta + l * across[1]), across, curve.point, hostWidth);
    if (mu === null) return null;
    let face: number = curve.face;
    let hostChart: [number, number] = [curve.y + mu * across[0], curve.theta + mu * across[1]];
    let direction: [number, number] = across;

    // An offset that leaves its face continues on the neighbour from the
    // crossing, along the same world direction in the neighbour's chart.
    for (let k: number = 0; k < SWITCHES && !host.kept(face, hostChart[0], hostChart[1]); k++) {
      const from: [number, number] = k === 0 ? [curve.y, curve.theta] : hostChart;
      const inside: (l: number) => boolean = (l: number): boolean =>
        host.kept(face, from[0] + l * (hostChart[0] - from[0]), from[1] + l * (hostChart[1] - from[1]));
      let lo: number = 0;
      let hi: number = 1;
      for (let i: number = 0; i < CROSSING_BISECTIONS; i++) {
        const m: number = (lo + hi) / 2;
        if (inside(m)) lo = m;
        else hi = m;
      }
      const at: [number, number] = [from[0] + hi * (hostChart[0] - from[0]), from[1] + hi * (hostChart[1] - from[1])];
      const here: IJet = host.faces[face]!.jet(at[0], at[1]);
      const world: Vec3 = combine([
        [direction[0], here.u],
        [direction[1], here.v],
      ]);
      const next: { face: number; u: number; v: number } | null = host.across(face, at[0], at[1]);
      if (next === null) return null;
      const there: IJet = host.faces[next.face]!.jet(next.u, next.v);
      const e: [number, number] | null = AutoMovieSolidVector.solve2(
        dot(there.u, there.u),
        dot(there.u, there.v),
        dot(there.u, there.v),
        dot(there.v, there.v),
        [dot(there.u, world), dot(there.v, world)],
      );
      if (e === null) return null;
      const speed: number = norm(
        combine([
          [e[0], there.u],
          [e[1], there.v],
        ]),
      );
      if (!(speed > 0)) return null;
      face = next.face;
      direction = [e[0] / speed, e[1] / speed];
      const onward: IAutoMovieSolidSurface = host.faces[face]!;
      const start: [number, number] = [next.u, next.v];
      const nu: number | null = offset(
        (l: number): IJet => onward.jet(start[0] + l * direction[0], start[1] + l * direction[1]),
        direction,
        curve.point,
        hostWidth,
        Math.max(0, hostWidth - norm(sub(there.p, curve.point))),
      );
      if (nu === null) return null;
      hostChart = [start[0] + nu * direction[0], start[1] + nu * direction[1]];
    }

    // The rail in the normal section through the curve point: the plane of
    // the host's normal and its square direction at the preimage.
    const settled: [number, number] | null = section(host.faces[face]!, hostChart, curve.point, plane(b, across), hostWidth);
    if (settled === null) return null;
    hostChart = settled;
    if (!host.kept(face, hostChart[0], hostChart[1])) return null;

    return {
      curve,
      s,
      phi,
      sigma,
      partAcross,
      partPoint: part.jet(s, phi).p,
      hostFace: face,
      host: hostChart,
      across: direction,
      hostPoint: host.faces[face]!.jet(hostChart[0], hostChart[1]).p,
    };
  }

  /**
   * The unit normal of a rail's normal-section plane: the plane through the
   * curve point spanned by the surface's normal and the image of the square
   * direction at the preimage.
   *
   * @param j The surface's jet at the preimage.
   * @param e The square direction in its chart.
   * @returns The plane's unit normal.
   */
  function plane(j: IJet, e: readonly [number, number]): Vec3 {
    const d: Vec3 = combine([
      [e[0], j.u],
      [e[1], j.v],
    ]);
    return unit(cross(cross(j.u, j.v), d)) ?? [0, 0, 0];
  }

  /**
   * The point of a surface in a normal-section plane at a chord from a
   * point, by Newton's method in the chart from a start near it: the two
   * equations `(S - C) . m = 0` and `|S - C|^2 = w^2` in `(u, v)`. So a rail
   * depends on the surface and the curve alone, not on how the chart is
   * drawn.
   *
   * @param surface The surface.
   * @param start The chart point to start from.
   * @param from The curve point, mm.
   * @param m The plane's unit normal.
   * @param width The chord, mm.
   * @returns The chart point, or null when Newton fails.
   */
  function section(surface: IAutoMovieSolidSurface, start: readonly [number, number], from: Readonly<Vec3>, m: Readonly<Vec3>, width: number): [number, number] | null {
    if (!(norm(m) > 0)) return null;
    // Rounding grows with the coordinates, not with the chord: a sub-millimetre
    // chord far from the origin still converges to the coordinates' precision.
    const scale: number = width + norm(from);
    let x: [number, number] = [start[0], start[1]];
    for (let step: number = 0; step < STEPS; step++) {
      const j: IJet = surface.jet(x[0], x[1]);
      const r: Vec3 = sub(j.p, from);
      const f1: number = dot(r, m);
      const f2: number = dot(r, r) - width * width;
      const done: boolean = Math.abs(f1) <= ROUNDING * scale && Math.abs(f2) <= 2 * width * ROUNDING * scale;
      const dx: [number, number] | null = AutoMovieSolidVector.solve2(dot(j.u, m), dot(j.v, m), 2 * dot(r, j.u), 2 * dot(r, j.v), [-f1, -f2]);
      if (dx === null) return null;
      x = [x[0] + dx[0], x[1] + dx[1]];
      if (done) return x;
    }
    return null;
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
    const e: [number, number] | null = AutoMovieSolidVector.solve2(E, F, F, G, [-tangent[1], tangent[0]]);
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
   * @param start The first guess of the chord still to travel from the direction's origin, mm; absent, `width`.
   * @returns The chart distance, or null when the solve fails or the width is not positive.
   */
  function offset(along: (l: number) => IJet, d: readonly [number, number], from: Readonly<Vec3>, width: number, start?: number): number | null {
    if (!(width > 0)) return null;
    const j0: IJet = along(0);
    const speed: number = norm(combine([
      [d[0], j0.u],
      [d[1], j0.v],
    ]));
    if (!(speed > 0)) return null;
    let l: number = (start ?? width) / speed;
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
      const converged: boolean = Math.abs(miss) <= ROUNDING * (width + norm(from));
      l -= miss / rate;
      if (converged) return l;
    }
    return null;
  }
}
