import type { AutoMovieConstructionPortCurve as PortCurve } from "./AutoMovieConstructionPortCurve";
import { AutoMovieConstructionPortField as Field } from "./AutoMovieConstructionPortField";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World point or derivative, mm. */
type Vec3 = AutoMovieSolidVector.Vec3;

/** A chart point or chart derivative. */
type V2 = [number, number];

/** A chart curve's point with its first and second derivatives in the band's clock. */
interface ICurve2 {
  p: V2;
  d1: V2;
  d2: V2;
}

/** A field's 2-jet in its cross parameter `s` and the band's clock `v`. */
interface IJet2 {
  p: Vec3;
  s: Vec3;
  v: Vec3;
  ss: Vec3;
  sv: Vec3;
  vv: Vec3;
}
const { combine, norm, sub }: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/**
 * A port's band with exact seams (`IAutoMovieConstructionPort`): at every clock, not only at its columns, its start edge is the host's
 * point on the port curve and its end edge the part's point on its rail, and it meets each G2 with the side's own 2-jet across the seam.
 *
 * Method: the band blends two real fields (construction.md, Ports), each side's own surface read past its seam, with the quintic
 * Hermite weights. With `s = u / L` its cross share and `c` its clock,
 *
 * ```text
 * S(s, c) = W(s) A(sigma(s), c) + W(1 - s) B(sigma(1 - s), c),   W(s) = (1 - s)^3 (1 + 3 s + 6 s^2),   sigma(s) = s (1 + 3 s) / (1 + 3 s + 6 s^2)
 * ```
 *
 * `W` and `W(1 - s)` are the quintic Hermite value weights, a partition of unity flat to second order at both ends, and
 * `W sigma` is the Hermite weight of the first derivative, so at a column the band leaves each seam with the same ribbons as the column
 * strip (`AutoMovieSolidBlendChain.strip`). `A(t, c) = H(x(c) + t e(c))` is the host itself, read from the port curve `x(c)` along the
 * band's inward chart direction `e(c) = g(c) d(c)`, inside the curve where the host's surface runs on under the band. `B(t, c)`
 * continues the part across its rail `(rho(chi(c)), chi(c))` toward its end with the part's own 2-jet at the rail, yet reads the part
 * only on its rail and in its kept side: `B = 6 P(r) - 8 P(r + t m / 2) + 3 P(r + t m)`, `m = into g(c)` along the station, whose
 * value, slope and bend in `t` at the rail are those of `P(r - t m)` (`REFLECTED`). A part publishes little or nothing between its end
 * and its rail (a millimetre on a mound), so the band asks for none of it. The blend of two surfaces by a weight flat to order n meets
 * each Gn (E. Hartmann, "Parametric Gn blending of curves and surfaces", The Visual Computer 17, 2001); here the whole 2-jet of `S` at
 * `s = 0` is that of `H(x(c) + s e(c))`, the ribbon composition `AutoMovieSolidRibbon` shows G2 to the host for any smooth direction
 * field, and likewise at `s = 1`. Every derivative of `S` is the chain rule on the two sides' own 2-jets and on the clock fields, so no
 * side's third derivative is needed and none is invented.
 *
 * Why a strip is read and not the 2-jet at each seam alone: a band spanned from the seams' 2-jets (the column strip's ribbons) has its
 * own clock derivatives in the sides' third and fourth derivatives, which a surface's 2-jet does not supply; the column strip avoids
 * them by interpolating the ribbons between columns, which is what leaves its seams inexact there. Reading each side at a distance
 * that shrinks to zero at its seam gives the same 2-jet at the seam and real derivatives everywhere. Each side is read at most
 * `sigma(1) = 0.4` of its ribbon from its seam: the host inside the port curve, the part in its kept side.
 *
 * The clock fields join per-column values by the periodic cubic (`AutoMovieConstructionPortField.periodic`): the port curve's share
 * (in `PortCurve.ICurve`), each side's cross speed `g` (the column's ribbon factor times its chord over the side's speed along the
 * direction, exactly the column strip's ribbon at each column), the part's phase `chi(c) = sense c + delta(c)` through the column
 * correspondence, and a curved rail's station `rho`. No second interpolation of either seam exists: the host's trim reads the same port
 * curve and the part's rail cycle the same `rho` (`AutoMovieSolidCycle.IExact`).
 *
 * Between its seams the band is not the column strip: the strip spans each side's second-order ribbon, this band each side's surface,
 * and the two differ by the sides' third-order terms over the ribbon, largest near the middle of the span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the blend, both readings, the clock fields, the continuity at both seams with their sources and the difference from the column strip.
 * @evidence contracts/development/design.md#principled-representation One generating owner per seam: the band evaluates the host on the port curve and the part on its rail at every clock, with their own cross 2-jets, instead of interpolating sampled columns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The input, the band with its correspondence, and one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Admission refuses a non-monotone correspondence, a non-positive cross speed or a reading outside a side's domain; nothing is clamped or extrapolated past a domain.
 */
export namespace AutoMovieConstructionPortBand {
  /**
   * The part's side: its surface, its rail station field over its own phase, and its station sign into its kept side.
   *
   * @evidence contracts/development/design.md#principled-representation The rail is the part's curve `u = rho(phi)` in its chart, the one its rail cycle reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only.
   * @evidence contracts/development/common.md#meaningful-documentation States the units and the sign.
   */
  export interface ISide {
    /** The part's surface, mm. */
    surface: IAutoMovieSolidSurface;

    /** The rail's station at the part's phase, mm, with two derivatives. */
    rail: Field.IField;

    /** The station's sign into the part's kept side. */
    into: 1 | -1;
  }

  /**
   * What the band is built from: the column strip's own results and both sides.
   *
   * @evidence contracts/development/design.md#principled-representation The column strip has already admitted the columns, their correspondence and their ribbon factors; this band joins those values round the loop.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two sides, the port curve, the column data and the span.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit and indexing.
   */
  export interface IInput {
    /** The band's face name. */
    name: string;

    /** The host's surface, mm. */
    host: IAutoMovieSolidSurface;

    /** The port curve on the host's chart. */
    curve: PortCurve.ICurve;

    /** The part's side. */
    child: ISide;

    /** The part's phase at each column, radians, unwrapped along the clock (`AutoMovieConstructionSplitBand.IStrip.childPhases`). */
    childPhases: readonly number[];

    /** Each column's ribbon factor (`AutoMovieConstructionSplitBand.IStrip.field`). */
    field: readonly number[];

    /** The band's span, mm: its station runs from 0 at the port curve to this at the rail. */
    length: number;

    /** The sign that turns `S_u x S_v` outward, the column strip's. */
    orientation: 1 | -1;
  }

  /**
   * The band and its correspondence to the part.
   *
   * @evidence contracts/development/design.md#principled-representation The surface with the two maps the part's seam needs in both directions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The maps are the band's own correspondence, not a nearest search.
   * @evidence contracts/development/common.md#meaningful-documentation States each reader's charts.
   */
  export interface IBand {
    /** The band's surface: chart `(station mm, clock rad)`, period `2 pi`, domain `[0, length]`. */
    surface: IAutoMovieSolidSurface;

    /**
     * The part's chart point on its rail at a band clock.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the chart.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; `create` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
     */
    rail: (clock: number) => V2;

    /**
     * The band clock whose rail point stands at a part phase: the inverse of the monotone correspondence, in `[0, 2 pi)`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the range.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; `create` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
     */
    clock: (phase: number) => number;
  }

  /**
   * Build the band, or the reason it cannot be built.
   *
   * @param input The sides, the port curve and the column strip's results.
   * @returns The band, or the refusal.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each column's cross speeds are the column strip's ribbons (factor times chord over the side's speed along its direction), joined by the periodic cubic; the surface is the Hartmann blend of the host read inside the port curve and the part reflected across its rail from its kept side, its jets by the chain rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Column values, clock fields, admission, then one jet reader built from one side reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a correspondence whose derivative reaches zero, a cross speed whose controls reach zero and a reading outside a side's domain, each bound from the fields' controls over each column span rather than from samples.
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusals.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n) to prepare; a jet reads one host and three part jets, fewer on a seam.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The clock fields are prepared once for every reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The surface retains the two sides, the curve and four fields.
   */
  export function create(input: IInput): IBand | string {
    const { host, curve, child, childPhases, field, length: L }: IInput = input;
    const n: number = childPhases.length;
    const turn: number = 2 * Math.PI;
    const clock: (k: number) => number = (k: number): number => (turn * k) / n;
    if (field.length !== n || curve.addresses.length !== n)
      return `the band has ${n} columns, ${field.length} factors and ${curve.addresses.length} port points`;

    // Each column's cross speeds, the column strip's own ribbons: factor times the column's chord over each side's speed along its direction.
    const sense: number = Math.sign(childPhases[n - 1]! - childPhases[0]!);
    const starts: number[] = [];
    const ends: number[] = [];
    for (let k: number = 0; k < n; ++k) {
      const [u, v]: V2 = curve.addresses[k]!;
      const h: IAutoMovieSolidSurface.IJet = host.jet(u, v);
      const station: number = child.rail.at(childPhases[k]!)[0];
      const far: IAutoMovieSolidSurface.IJet = child.surface.jet(station, childPhases[k]!);
      const chord: number = norm(sub(far.p, h.p));
      const [du, dv]: V2 = curve.inward[k]!;
      const speed: number = norm(combine([[du, h.u], [dv, h.v]]));
      starts.push((field[k]! * chord) / speed);
      ends.push((field[k]! * chord) / norm(far.u));
    }
    const ga: Field.IField = Field.periodic(starts);
    const gb: Field.IField = Field.periodic(ends);
    const delta: Field.IField = Field.periodic(
      childPhases.map((phase: number, k: number): number => phase - sense * clock(k)),
    );

    // Admission from the fields' own bounds: positive speeds and a monotone correspondence.
    if (!(ga.bounds[0] > 0 && gb.bounds[0] > 0))
      return "a side's cross speed between the band's columns is not positive";
    if (!(sense !== 0 && (sense > 0 ? 1 + delta.slopes[0] > 0 : 1 - delta.slopes[1] > 0)))
      return "the part's phase between the band's columns does not advance with its clock";

    /** The part's phase at a band clock with two derivatives. */
    const phase = (c: number): [number, number, number] => {
      const [x, x1, x2]: [number, number, number] = delta.at(c);
      return [sense * c + x, sense + x1, x2];
    };

    // Every reading inside its side's domain, span by span: over the clocks of one column span each field lies within its controls
    // there (`Field.IField.range`). The host is read at the station `y0 + a cos c (r - t g)`, the part at `rho(chi) - into t g`, for
    // `t` in `[0, sigma(1)]`.
    const y0: number = (curve.reach[0] + curve.reach[1]) / 2;
    for (let k: number = 0; k < n; ++k) {
      const [from, to]: [number, number] = [clock(k), clock(k + 1)];
      if (host.domain !== undefined) {
        const r: [number, number] = curve.share.range(from, to);
        const g: [number, number] = ga.range(from, to);
        const factors: [number, number] = [r[0] - SIGMA_END * g[1], r[1]];
        const cosines: number[] = [Math.cos(from), Math.cos(to)];
        if (Math.floor(from / Math.PI) !== Math.floor(to / Math.PI))
          cosines.push(Math.floor(to / Math.PI) % 2 === 0 ? 1 : -1);
        const products: number[] = cosines.flatMap((w: number): number[] => [w * factors[0], w * factors[1]]);
        if (
          !(y0 + curve.semi * Math.min(...products) >= host.domain[0] &&
            y0 + curve.semi * Math.max(...products) <= host.domain[1])
        )
          return `the band reads the host past its domain inside the port curve between columns ${k} and ${k + 1}`;
      }
      if (child.surface.domain !== undefined) {
        const rho: [number, number] = child.rail.range(phase(from)[0], phase(to)[0]);
        const reach: number = SIGMA_END * gb.range(from, to)[1];
        if (
          !(rho[0] - Math.max(0, -child.into * reach) >= child.surface.domain[0] &&
            rho[1] + Math.max(0, child.into * reach) <= child.surface.domain[1])
        )
          return `the band reads the part past its domain on its kept side of its rail between columns ${k} and ${k + 1}`;
      }
    }

    /** The rail's chart curve on the part at a band clock. */
    const rail = (c: number): ICurve2 => {
      const [chi, chi1, chi2]: [number, number, number] = phase(c);
      const [r, r1, r2]: [number, number, number] = child.rail.at(chi);
      return { p: [r, chi], d1: [r1 * chi1, chi1], d2: [r2 * chi1 * chi1 + r1 * chi2, chi2] };
    };

    /** The host's direction of reading, `g d`, into the port curve. */
    const inside = (c: number): ICurve2 => {
      const [g, g1, g2]: [number, number, number] = ga.at(c);
      const { d, first, second }: { d: V2; first: V2; second: V2 } = curve.direction(c);
      return {
        p: [g * d[0], g * d[1]],
        d1: [g1 * d[0] + g * first[0], g1 * d[1] + g * first[1]],
        d2: [g2 * d[0] + 2 * g1 * first[0] + g * second[0], g2 * d[1] + 2 * g1 * first[1] + g * second[1]],
      };
    };

    /** The part's direction of reading, `g (into, 0)`, from its rail into its kept side. */
    const kept = (c: number): ICurve2 => {
      const [g, g1, g2]: [number, number, number] = gb.at(c);
      return { p: [g * child.into, 0], d1: [g1 * child.into, 0], d2: [g2 * child.into, 0] };
    };

    const surface: IAutoMovieSolidSurface = {
      name: input.name,
      orientation: input.orientation,
      period: turn,
      domain: [0, L],
      jet: (u: number, c: number): IAutoMovieSolidSurface.IJet => {
        const s: number = u / L;
        const zero: Vec3 = [0, 0, 0];
        let out: IJet2 = { p: zero, s: zero, v: zero, ss: zero, sv: zero, vv: zero };

        // Each side's term vanishes with its whole 2-jet at the other side's seam (`W(1) = W'(1) = W''(1) = 0`).
        if (s !== 1) {
          const edge: { point: V2; first: V2; second: V2 } = curve.at(c);
          out = add(out, weigh(side(host, { p: edge.point, d1: edge.first, d2: edge.second }, inside(c), sigma(s)[0], DIRECT), s, 1));
        }
        if (s !== 0) out = add(out, weigh(side(child.surface, rail(c), kept(c), sigma(1 - s)[0], REFLECTED), 1 - s, -1));
        return {
          p: out.p,
          u: scale(out.s, 1 / L),
          v: out.v,
          uu: scale(out.ss, 1 / (L * L)),
          uv: scale(out.sv, 1 / L),
          vv: out.vv,
        };
      },
    };
    return {
      surface,
      rail: (c: number): V2 => rail(c).p,
      clock: (target: number): number => {
        // The clock in [0, 2 pi) whose phase stands at the target's turn: phase(c) - phase(0) runs monotonically through one turn.
        const base: number = phase(0)[0];
        const x: number = sense * (target - base);
        const goal: number = base + sense * (x - turn * Math.floor(x / turn));
        let [lo, hi]: [number, number] = [0, turn];
        for (let step: number = 0; step < 200; ++step) {
          const mid: number = (lo + hi) / 2;
          if (mid === lo || mid === hi) break;
          if (sense * (phase(mid)[0] - goal) < 0) lo = mid;
          else hi = mid;
        }
        return Math.abs(sense * (phase(lo)[0] - goal)) <= Math.abs(sense * (phase(hi)[0] - goal)) ? lo : hi % turn;
      },
    };
  }

  /**
   * A band carried in by a cross profile: the band plus the profile's displacement, the profiled column strip less the plain one
   * (`AutoMovieConstructionSplitBand.profiled`), all three in the band's chart.
   *
   * @param band The exact band's surface.
   * @param shaped The profiled column strip's surface.
   * @param plain The plain column strip's surface.
   * @returns The carried band's surface, with the band's name, orientation, period and domain.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The two strips share their rail layers, so their difference vanishes with its cross 2-jet at both rails at every column and the carried band keeps the exact band's seams; every jet is the sum of the three surfaces' own jets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One jet reader over three readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No derivative is approximated and no depth is refitted; between columns the displacement at the rails is the two strips' interpolation difference, which the exact seams' readers do not consult.
   * @evidence contracts/development/common.md#meaningful-documentation States the three surfaces and what the sum keeps.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three jets per reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reader coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The surface retains the three surfaces.
   */
  export function carried(
    band: IAutoMovieSolidSurface,
    shaped: IAutoMovieSolidSurface,
    plain: IAutoMovieSolidSurface,
  ): IAutoMovieSolidSurface {
    return {
      ...band,
      jet: (u: number, c: number): IAutoMovieSolidSurface.IJet => {
        const [a, b, e]: [IAutoMovieSolidSurface.IJet, IAutoMovieSolidSurface.IJet, IAutoMovieSolidSurface.IJet] = [
          band.jet(u, c),
          shaped.jet(u, c),
          plain.jet(u, c),
        ];
        const sum = (x: Vec3, y: Vec3, z: Vec3): Vec3 => combine([[1, x], [1, y], [-1, z]]);
        return {
          p: sum(a.p, b.p, e.p),
          u: sum(a.u, b.u, e.u),
          v: sum(a.v, b.v, e.v),
          uu: sum(a.uu, b.uu, e.uu),
          uv: sum(a.uv, b.uv, e.uv),
          vv: sum(a.vv, b.vv, e.vv),
        };
      },
    };
  }

  /** `sigma(1)`, the farthest cross parameter either side is read at. */
  const SIGMA_END: number = 0.4;

  /** The cross parameter `sigma(s) = s (1 + 3 s) / (1 + 3 s + 6 s^2)` with its first and second derivatives; its denominator has no real root. */
  function sigma(s: number): [number, number, number] {
    const N: number = s + 3 * s * s;
    const N1: number = 1 + 6 * s;
    const D: number = 1 + 3 * s + 6 * s * s;
    const D1: number = 3 + 12 * s;
    const value: number = N / D;
    const first: number = (N1 * D - N * D1) / (D * D);
    const second: number = ((6 * D - N * 12) * D - 2 * D1 * (N1 * D - N * D1)) / (D * D * D);
    return [value, first, second];
  }

  /** The quintic Hermite value weight `W(s) = (1 - s)^3 (1 + 3 s + 6 s^2)` with its first and second derivatives. */
  function hermite(s: number): [number, number, number] {
    return [
      1 - s * s * s * (10 - 15 * s + 6 * s * s),
      -30 * s * s * (1 - 2 * s + s * s),
      -60 * s * (1 - 3 * s + 2 * s * s),
    ];
  }

  /**
   * One side's term `W(t) E(sigma(t), c)` of the blend at its own share `t`, its cross derivatives turned into the band's share `s` by
   * `ds / dt = sign`.
   */
  function weigh(E: IJet2, t: number, sign: 1 | -1): IJet2 {
    const [W, W1, W2]: [number, number, number] = hermite(t);
    const [, g1, g2]: [number, number, number] = sigma(t);
    return {
      p: scale(E.p, W),
      s: scale(combine([[W1, E.p], [W * g1, E.s]]), sign),
      ss: combine([[W2, E.p], [2 * W1 * g1 + W * g2, E.s], [W * g1 * g1, E.ss]]),
      v: scale(E.v, W),
      sv: scale(combine([[W1, E.v], [W * g1, E.sv]]), sign),
      vv: scale(E.vv, W),
    };
  }

  /** The host's reading: the surface itself along its direction, one node of weight 1. */
  const DIRECT: readonly (readonly [number, number])[] = [[1, 1]];

  /**
   * The part's reading: Hestenes' reflection of its kept side across its rail (M. R. Hestenes, "Extension of the range of a
   * differentiable function", Duke Math. J. 8, 1941), nodes `(lambda, kappa)` with `sum kappa = 1`, `sum kappa lambda = -1` and
   * `sum kappa lambda^2 = 1`, so `sum kappa F(x + lambda t m)` has the value, slope and bend in `t` of `F(x - t m)` at the rail while
   * every point read lies on the rail or in the kept side. The farther node stands at 1, so the part is read as far past its rail as the
   * host past the port curve, `sigma(1)` of a ribbon; the three conditions then fix the weights of the nodes 0, 1/2 and 1.
   */
  const REFLECTED: readonly (readonly [number, number])[] = [
    [0, 6],
    [0.5, -8],
    [1, 3],
  ];

  /**
   * A side's surface read from its seam curve `x(c)` along `m(c)`: `sum kappa F(x(c) + lambda t m(c))` over the nodes, with its 2-jet
   * in `(t, c)` by the chain rule on the surface's own 2-jet at each point read.
   */
  function side(
    surface: IAutoMovieSolidSurface,
    x: ICurve2,
    m: ICurve2,
    t: number,
    nodes: readonly (readonly [number, number])[],
  ): IJet2 {
    let out: IJet2 = { p: [0, 0, 0], s: [0, 0, 0], v: [0, 0, 0], ss: [0, 0, 0], sv: [0, 0, 0], vv: [0, 0, 0] };
    for (const [lambda, kappa] of nodes) {
      const qt: V2 = [lambda * m.p[0], lambda * m.p[1]];
      const qc: V2 = [x.d1[0] + lambda * t * m.d1[0], x.d1[1] + lambda * t * m.d1[1]];
      const qtc: V2 = [lambda * m.d1[0], lambda * m.d1[1]];
      const qcc: V2 = [x.d2[0] + lambda * t * m.d2[0], x.d2[1] + lambda * t * m.d2[1]];
      const j: IAutoMovieSolidSurface.IJet = surface.jet(x.p[0] + lambda * t * m.p[0], x.p[1] + lambda * t * m.p[1]);
      const J = (a: V2): Vec3 => combine([[a[0], j.u], [a[1], j.v]]);
      const H = (a: V2, b: V2): Vec3 =>
        combine([[a[0] * b[0], j.uu], [a[0] * b[1] + a[1] * b[0], j.uv], [a[1] * b[1], j.vv]]);
      out = add(out, {
        p: scale(j.p, kappa),
        s: scale(J(qt), kappa),
        v: scale(J(qc), kappa),
        ss: scale(H(qt, qt), kappa),
        sv: scale(combine([[1, H(qt, qc)], [1, J(qtc)]]), kappa),
        vv: scale(combine([[1, H(qc, qc)], [1, J(qcc)]]), kappa),
      });
    }
    return out;
  }

  /** Two 2-jets summed. */
  function add(a: IJet2, b: IJet2): IJet2 {
    return {
      p: combine([[1, a.p], [1, b.p]]),
      s: combine([[1, a.s], [1, b.s]]),
      v: combine([[1, a.v], [1, b.v]]),
      ss: combine([[1, a.ss], [1, b.ss]]),
      sv: combine([[1, a.sv], [1, b.sv]]),
      vv: combine([[1, a.vv], [1, b.vv]]),
    };
  }

  /** A vector times a number. */
  function scale(a: Vec3, k: number): Vec3 {
    return [a[0] * k, a[1] * k, a[2] * k];
  }
}
