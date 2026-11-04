import type { AutoMovieHumanLoftContract } from "./AutoMovieHumanLoftContract";
import { AutoMovieHumanIllinois } from "./AutoMovieHumanIllinois";
import { AutoMovieHumanPolarSector } from "./AutoMovieHumanPolarSector";
import type { IAutoMovieHumanViewPart } from "./IAutoMovieHumanViewPart";

type Quarters<T> = IAutoMovieHumanViewPart.IQuarters<T>;

/**
 * One section of a part from its views: the box its four outlines make about
 * the axis, the section touching each side of the box at one guide, and the
 * quarters' fullness as one conic shoulder value each (Liming's conic
 * lofting), represented by the quintic polar sectors of
 * `AutoMovieHumanPolarSector`.
 *
 * The box is four positive half extents from the axis, `e = [e0, e1, e2, e3]`
 * along `+u`, `+v`, `-u` and `-v`. Guide `g` stands at the angle `g pi / 2`
 * with the radius `e_g` and the angular slope 0: a polar curve meets the side
 * `x = e_0` at angle 0 tangentially exactly when `rho_phi = 0` there, since
 * `x_phi = rho_phi cos phi - rho sin phi` vanishes at `phi = 0` only then. So
 * the section's extreme along each chart axis is the outline's value.
 *
 * Quarter `q` runs from guide `q` to guide `q + 1` over the box corner
 * `(a, b) = (e_q, e_{q+1})` in the quarter's own axes. Its conic shoulder `r`
 * is the share along the diagonal from the chord's middle `(a, b) / 2` to the
 * corner where the section crosses: the shoulder point
 * `S = (1 + r) (a, b) / 2`, at the radius `(1 + r) sqrt(a^2 + b^2) / 2`. The
 * conic through both touch points with that shoulder is the rational
 * quadratic Bezier of the touch points and the corner with the middle weight
 * `w = r / (1 - r)`, so `r = sqrt(2) - 1` (`w = 1 / sqrt(2)`) is the quarter
 * ellipse, `r -> 0` the chord (the rhombus) and `r -> 1` the corner (the
 * rectangle). Its curvature at the touch point of the guide of extent `a`,
 * across the extent `b`, is `kappa = a / (2 w^2 b^2)` (the end curvature of a
 * rational quadratic, `(w0 w2 / w1^2) h / (2 |P1 - P0|^2)`, with `h = a` the
 * distance of the far touch point from the guide's side and
 * `|P1 - P0| = b`), `a / b^2` for the ellipse.
 *
 * The guide's curvature law. Both quarters beside a guide meet in one
 * curvature, so the section is C2 there. Each quarter's own conic asks for
 * its `kappa`; the shared value is their mean, the least-squares compromise
 * of the two (the second angle derivative of the radius is linear in the
 * curvature at a guide, `rho_phiphi = e - kappa e^2` with `rho_phi = 0`, so
 * the mean curvature is also the mean `rho_phiphi`). A symmetric box with the
 * ellipse's shoulder in every quarter gives both quarters `a / b^2`, the
 * centred ellipse's own curvature.
 *
 * The quarter's fullness. Inside its quarter the section follows its conic:
 * the conic's points at the parameters `t = j / M` of its rational
 * quadratic, `j = 1 .. M - 1`, are guides too, each with the conic's own
 * radius and its first and second derivatives in the polar angle, and
 * between any two guides the section is the quintic Hermite of their jets
 * (`AutoMovieHumanPolarSector`, every bump zero), so it is C2 across every
 * guide. Uniform steps of the conic's parameter crowd the polar angles where
 * the radius turns fastest: near the end of a long half extent `a` over a
 * short `b` the radius varies over an angle of order `b / a`, and the
 * parameter step maps to an angle step of the same order, so the
 * interpolation error, which grows as the sixth power of the step over that
 * scale, does not grow with the box's aspect. A raw conic arc would meet its
 * neighbour only C1, a quarter superellipse of exponent above 2 has zero
 * curvature at its guide (a flat stripe along it), and one quintic with one
 * bump per quarter cannot follow a conic of aspect two or more without
 * turning concave.
 *
 * Reach. A shoulder is valid when the section stays star-shaped (a positive
 * radius), convex (the taut tape lies on it) and inside its box (the outlines
 * stay its extremes); the conic is all three for every shoulder in `(0, 1)`,
 * and the section follows it to the interpolation error. Under that, the
 * taut-tape girth is the section's length and rises with the shoulder (the
 * conics nest as the middle weight grows); the box bounds it between
 * `2 sqrt(W^2 + D^2)` (the rhombus) and `2 (W + D)` (the rectangle), `W` and
 * `D` the box's breadth and depth, and the section reaches the open part of
 * that range its valid shoulders span ({@link range}).
 */
export namespace AutoMovieHumanViewSection {
  /** The conic shoulder of the ellipse, `sqrt(2) - 1`. */
  export const ELLIPSE: number = Math.SQRT2 - 1;

  /** The box about the axis at one station. */
  export interface IBox {
    /** Half extents from the axis along `+u`, `+v`, `-u` and `-v`, mm, positive. */
    extents: Quarters<number>;
  }

  /** One section. */
  export interface ISection {
    /** Its box. */
    box: IBox;

    /** Each quarter's conic shoulder. */
    shoulders: Quarters<number>;

    /** The four guides at 0, `pi / 2`, `pi`, `3 pi / 2`: radius, angular slope 0 and the shared curvature. */
    guides: Quarters<AutoMovieHumanPolarSector.IGuide>;

    /** Every guide by increasing angle: the four main guides and each quarter's conic guides between them. */
    knots: AutoMovieHumanPolarSector.IGuide[];

    /** Each quarter's bump amplitude in `AutoMovieHumanPolarSector`'s sense: zero, the conic guides carry the fullness. */
    fullness: Quarters<number>;

    /** The taut-tape girth, the section's length while it is convex, mm. */
    girth: number;

    /**
     * Radius along each quarter's corner direction, mm: the diagonals are
     * observations, read for checks and never an owner of the shape.
     */
    diagonals: Quarters<number>;
  }

  /** The shoulders a box reaches and the girths they give. */
  export interface IRange {
    /** Least and greatest valid common shoulder, before each quarter's departure. */
    shoulder: [number, number];

    /** The girths at those shoulders, mm. */
    girth: [number, number];
  }

  /** A section solved from a girth. */
  export interface ISolved {
    /** The section; at a range end when the girth lies outside it; null when the box admits no valid section. */
    section: ISection | null;

    /** One diagnostic for a girth outside the reach or a box without a valid section; empty otherwise. */
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];
  }

  /**
   * Each guide's curvature, the mean of its two quarters' conic curvatures at
   * its touch point.
   *
   * @param box The box.
   * @param shoulders Each quarter's shoulder, inside `(0, 1)`.
   * @returns The curvature per guide, 1 per mm.
   */
  export function curvatures(box: IBox, shoulders: Quarters<number>): Quarters<number> {
    const e: Quarters<number> = box.extents;
    const conic = (q: number, along: number, across: number): number => {
      const w: number = shoulders[q]! / (1 - shoulders[q]!);
      return along / (2 * w * w * across * across);
    };
    return [0, 1, 2, 3].map((g: number): number => {
      const before: number = (g + 3) % 4;
      return (conic(before, e[g]!, e[before]!) + conic(g, e[g]!, e[(g + 1) % 4]!)) / 2;
    }) as Quarters<number>;
  }

  /**
   * The section of a box with each quarter's shoulder.
   *
   * @param box The box, every extent positive.
   * @param shoulders Each quarter's shoulder, inside `(0, 1)`.
   * @returns The section; its validity is {@link fault}'s.
   */
  export function of(box: IBox, shoulders: Quarters<number>): ISection {
    const section: ISection = bare(box, shoulders);
    const e: Quarters<number> = box.extents;
    section.diagonals = [0, 1, 2, 3].map(
      (q: number): number => radius(section, section.guides[q]!.angle + Math.atan2(e[(q + 1) % 4]!, e[q]!))[0],
    ) as Quarters<number>;
    section.girth = length(section);
    return section;
  }

  /**
   * A section's guides alone, its girth and diagonals left at zero: what the
   * validity check reads, so the range's bisection pays no quadrature.
   *
   * @param box The box, every extent positive.
   * @param shoulders Each quarter's shoulder, inside `(0, 1)`.
   * @returns The section without its measures.
   */
  export function bare(box: IBox, shoulders: Quarters<number>): ISection {
    const e: Quarters<number> = box.extents;
    const kappa: Quarters<number> = curvatures(box, shoulders);
    const guides: Quarters<AutoMovieHumanPolarSector.IGuide> = [0, 1, 2, 3].map(
      (g: number): AutoMovieHumanPolarSector.IGuide => ({
        angle: (g * Math.PI) / 2,
        value: e[g]!,
        slope: 0,
        curvature: e[g]! - kappa[g]! * e[g]! * e[g]!,
      }),
    ) as Quarters<AutoMovieHumanPolarSector.IGuide>;

    // Each quarter's conic guides between its main guides.
    const knots: AutoMovieHumanPolarSector.IGuide[] = [];
    for (let q: number = 0; q < 4; q++) {
      knots.push(guides[q]!);
      for (let j: number = 1; j < CONIC_SPANS; j++) knots.push(conic(e[q]!, e[(q + 1) % 4]!, shoulders[q]!, j / CONIC_SPANS, guides[q]!.angle));
    }

    return { box, shoulders: [...shoulders], guides, knots, fullness: [0, 0, 0, 0], girth: 0, diagonals: [0, 0, 0, 0] };
  }

  /**
   * A conic's guide: the point of a quarter's rational quadratic at a
   * parameter, as a polar radius with its first and second derivatives in the
   * angle.
   *
   * In the quarter's own axes the conic is `C(t) = N(t) / D(t)` with
   * `N = (1 - t)^2 P0 + 2 w t (1 - t) P1 + t^2 P2`,
   * `D = (1 - t)^2 + 2 w t (1 - t) + t^2`, `P0 = (a, 0)`, `P1 = (a, b)`,
   * `P2 = (0, b)` and `w = r / (1 - r)`. With `rho = |C|` and
   * `psi = atan2(y, x)`: `rho_t = C . C_t / rho`, `psi_t = (C x C_t) / rho^2`,
   * `rho_tt = (|C_t|^2 + C . C_tt - rho_t^2) / rho`,
   * `psi_tt = (C x C_tt) / rho^2 - 2 psi_t rho_t / rho`, and in the angle
   * `rho_psi = rho_t / psi_t`, `rho_psipsi = (rho_tt psi_t - rho_t psi_tt) / psi_t^3`.
   *
   * @param a The half extent along the quarter's first guide.
   * @param b The half extent along its second.
   * @param r The quarter's shoulder, inside `(0, 1)`.
   * @param t The conic's parameter, inside `(0, 1)`.
   * @param start The quarter's first guide angle.
   * @returns The guide.
   */
  export function conic(a: number, b: number, r: number, t: number, start: number): AutoMovieHumanPolarSector.IGuide {
    const w: number = r / (1 - r);
    const s: number = 1 - t;

    // Numerator and denominator with their first two derivatives in t.
    const N: [number, number] = [s * s * a + 2 * w * t * s * a, 2 * w * t * s * b + t * t * b];
    const N1: [number, number] = [-2 * s * a + 2 * w * (1 - 2 * t) * a, 2 * w * (1 - 2 * t) * b + 2 * t * b];
    const N2: [number, number] = [2 * a - 4 * w * a, -4 * w * b + 2 * b];
    const D: number = s * s + 2 * w * t * s + t * t;
    const D1: number = -2 * s + 2 * w * (1 - 2 * t) + 2 * t;
    const D2: number = 4 - 4 * w;

    // The quotient rule for C, C_t and C_tt.
    const C: [number, number] = [N[0] / D, N[1] / D];
    const C1: [number, number] = [(N1[0] - C[0] * D1) / D, (N1[1] - C[1] * D1) / D];
    const C2: [number, number] = [(N2[0] - 2 * C1[0] * D1 - C[0] * D2) / D, (N2[1] - 2 * C1[1] * D1 - C[1] * D2) / D];

    // Polar radius and angle with their t derivatives, then the chain rule.
    const rho: number = Math.hypot(C[0], C[1]);
    const rt: number = (C[0] * C1[0] + C[1] * C1[1]) / rho;
    const pt: number = (C[0] * C1[1] - C[1] * C1[0]) / (rho * rho);
    const rtt: number = (C1[0] * C1[0] + C1[1] * C1[1] + C[0] * C2[0] + C[1] * C2[1] - rt * rt) / rho;
    const ptt: number = (C[0] * C2[1] - C[1] * C2[0]) / (rho * rho) - (2 * pt * rt) / rho;
    return {
      angle: start + Math.atan2(C[1], C[0]),
      value: rho,
      slope: rt / pt,
      curvature: (rtt * pt - rt * ptt) / (pt * pt * pt),
    };
  }

  /**
   * The radius and its two angle derivatives at a chart angle.
   *
   * @param section The section.
   * @param phi Angle from `+u` toward `+v`, radians.
   * @returns `[rho, rho_phi, rho_phiphi]`.
   */
  export function radius(section: ISection, phi: number): AutoMovieHumanPolarSector.Jet {
    return AutoMovieHumanPolarSector.radius(section.knots, zeros(section.knots.length), phi);
  }

  /**
   * The section's length, `integral sqrt(rho^2 + rho_phi^2) dphi`, by
   * Gauss-Legendre quadrature on equal parts of each quarter; the integrand
   * is smooth inside a quarter, so the rule converges spectrally.
   *
   * @param section The section.
   * @returns Its length, mm; its taut-tape girth while it is convex.
   */
  export function length(section: ISection): number {
    let sum: number = 0;
    const h: number = QUARTER / PARTS;
    for (let k: number = 0; k < 4 * PARTS; k++) {
      const middle: number = (k + 0.5) * h;
      for (let i: number = 0; i < GAUSS_NODES.length; i++) {
        const [r, r1] = radius(section, middle + (GAUSS_NODES[i]! * h) / 2);
        sum += ((GAUSS_WEIGHTS[i]! * h) / 2) * Math.hypot(r, r1);
      }
    }
    return sum;
  }

  /**
   * Why a section is not a valid view section, or null when it is: a radius
   * not above zero, a turn of the outline against convexity
   * (`rho^2 + 2 rho_phi^2 - rho rho_phiphi < 0`, the curvature's numerator),
   * or a point past a side of its box.
   *
   * @param section The section.
   * @returns The first fault with its angle and numbers, or null.
   */
  export function fault(section: ISection): string | null {
    const e: Quarters<number> = section.box.extents;
    for (let q: number = 0; q < 4; q++) {
      const start: number = (q * Math.PI) / 2;
      for (let k: number = 0; k <= CHECKS; k++) {
        const phi: number = start + (k * QUARTER) / CHECKS;
        const [r, r1, r2] = radius(section, phi);
        if (!(r > 0)) return `radius ${r} mm at angle ${phi}`;
        const turn: number = r * r + 2 * r1 * r1 - r * r2;
        if (turn < -CONVEX * r * r) return `concave at angle ${phi} (curvature numerator ${turn} mm^2)`;

        // Projections on the quarter's two guide directions stay within
        // their sides.
        const along: number = r * Math.cos(phi - start);
        const across: number = r * Math.sin(phi - start);
        if (along > e[q]! * (1 + INSIDE)) return `past side ${q} by ${along - e[q]!} mm at angle ${phi}`;
        if (across > e[(q + 1) % 4]! * (1 + INSIDE)) return `past side ${(q + 1) % 4} by ${across - e[(q + 1) % 4]!} mm at angle ${phi}`;
      }
    }
    return null;
  }

  /**
   * The common shoulders a box admits with each quarter's departure, and
   * their girths: from the ellipse's shoulder, the last valid shoulder each
   * way by bisection on {@link fault}.
   *
   * @param box The box.
   * @param departures Each quarter's departure from the common shoulder.
   * @returns The range, or null when the ellipse's shoulder itself is not valid.
   */
  export function range(box: IBox, departures: Quarters<number> = [0, 0, 0, 0]): IRange | null {
    const at = (r: number): ISection | null => {
      const s: Quarters<number> = departures.map((d: number): number => r + d) as Quarters<number>;
      if (!s.every((x: number): boolean => x > 0 && x < 1)) return null;
      const section: ISection = bare(box, s);
      return fault(section) === null ? section : null;
    };
    if (at(ELLIPSE) === null) return null;

    // Halvings to the shoulder share whose girth change stays inside the
    // solve's tolerance: the girth spans less than the rectangle's 2 (W + D)
    // over the shoulders.
    const e: Quarters<number> = box.extents;
    const steps: number = Math.ceil(Math.log2((2 * (e[0] + e[1] + e[2] + e[3])) / GIRTH_TOLERANCE));
    const edge = (inside: number, outside: number): number => {
      let a: number = inside;
      let b: number = outside;
      for (let i: number = 0; i < steps; i++) {
        const m: number = (a + b) / 2;
        if (at(m) !== null) a = m;
        else b = m;
      }
      return a;
    };
    const lo: number = edge(ELLIPSE, 0);
    const hi: number = edge(ELLIPSE, 1);
    const shaped = (r: number): ISection => of(box, departures.map((d: number): number => r + d) as Quarters<number>);
    return { shoulder: [lo, hi], girth: [shaped(lo).girth, shaped(hi).girth] };
  }

  /**
   * The section whose taut-tape girth is the given one: the common shoulder
   * by the Illinois rule on the girth over the valid range. A girth outside
   * the reach gives the range's end shape and one diagnostic.
   *
   * @param producer Part and station, for the diagnostic.
   * @param box The box.
   * @param girth The taut-tape girth, mm.
   * @param departures Each quarter's departure from the common shoulder.
   * @returns The section and its diagnostics.
   */
  export function solve(
    producer: string,
    box: IBox,
    girth: number,
    departures: Quarters<number> = [0, 0, 0, 0],
  ): ISolved {
    const reach: IRange | null = range(box, departures);
    const e: Quarters<number> = box.extents;
    const W: number = e[0] + e[2];
    const D: number = e[1] + e[3];
    const shaped = (r: number): ISection =>
      of(box, departures.map((d: number): number => r + d) as Quarters<number>);
    if (reach === null)
      return {
        section: null,
        diagnostics: [
          {
            producer,
            level: 2,
            contract: "view section",
            detail: `the box [${e.join(", ")}] mm with departures [${departures.join(", ")}] admits no valid section at the ellipse's shoulder`,
          },
        ],
      };
    const [lo, hi] = reach.girth;
    if (!(girth >= lo && girth <= hi)) {
      const end: number = girth < lo ? reach.shoulder[0] : reach.shoulder[1];
      return {
        section: shaped(end),
        diagnostics: [
          {
            producer,
            level: 2,
            contract: "girth in reach",
            detail: `girth ${girth} mm outside the reach ${lo} to ${hi} mm of the box ${W} by ${D} mm (rhombus ${2 * Math.hypot(W, D)} mm, rectangle ${2 * (W + D)} mm); the section is the shoulder ${end}`,
          },
        ],
      };
    }
    const r: number =
      AutoMovieHumanIllinois.root(
        (x: number): number => shaped(x).girth - girth,
        reach.shoulder[0],
        reach.shoulder[1],
        GIRTH_TOLERANCE,
        ITERATIONS,
      ) ?? (girth - lo < hi - girth ? reach.shoulder[0] : reach.shoulder[1]);
    return { section: shaped(r), diagnostics: [] };
  }
}

/** A quarter turn. */
const QUARTER: number = Math.PI / 2;

/**
 * Spans of each quarter's conic between guides: its parameter in four equal
 * steps. The interpolation error of a quintic Hermite span grows as the sixth
 * power of its angle over the angle the radius turns in, and the parameter's
 * steps follow that angle at every aspect, so four steps of a quarter turn of
 * the conic's parameter leave an error of order `(pi / 8)^6 / 720`, about
 * `5e-6`, of the radius whatever the box's aspect.
 */
const CONIC_SPANS: number = 4;

/** Zero fullness for each count of guides, made once. */
const ZEROS: Map<number, number[]> = new Map();

/** Zero fullness for a count of guides. */
function zeros(n: number): number[] {
  let z: number[] | undefined = ZEROS.get(n);
  if (z === undefined) {
    z = new Array<number>(n).fill(0);
    ZEROS.set(n, z);
  }
  return z;
}

/**
 * Equal parts of each quarter for the length's quadrature. The
 * {@link GAUSS_NODES} eight-point rule is exact for polynomials of degree 15
 * on each part, and the speed `sqrt(rho^2 + rho_phi^2)` of a positive radius
 * is analytic there, so the error falls geometrically with the parts; the
 * ellipse test reads it against Ramanujan's perimeter.
 */
const PARTS: number = 8;

/** Gauss-Legendre nodes on `[-1, 1]`, eight points (Abramowitz and Stegun, table 25.4). */
const GAUSS_NODES: readonly number[] = [
  -0.9602898564975363, -0.7966664774136267, -0.525532409916329, -0.1834346424956498, 0.1834346424956498, 0.525532409916329, 0.7966664774136267,
  0.9602898564975363,
];

/** Gauss-Legendre weights matching {@link GAUSS_NODES}. */
const GAUSS_WEIGHTS: readonly number[] = [
  0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.2223810344533745,
  0.1012285362903763,
];

/**
 * Angles read per quarter by the validity check. The curvature numerator of
 * a degree-6 radius is a polynomial of degree 12 in the quarter's share, so
 * it changes sign at most 12 times; 96 equal parts put eight readings in the
 * mean gap between two of its roots.
 */
const CHECKS: number = 96;

/** Relative rounding allowed on the convexity numerator, `rho^2` its scale. */
const CONVEX: number = 1e-12;

/** Relative rounding allowed past a side, the extent its scale; a touch is exact at the guide. */
const INSIDE: number = 1e-12;


/** Accepted girth error of the solve, mm: a thousandth of a micrometre. */
const GIRTH_TOLERANCE: number = 1e-6;

/** Most Illinois steps of the girth solve. */
const ITERATIONS: number = 100;
