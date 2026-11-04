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
 * The quarter's fullness. Between its guides the quarter is the quintic
 * Hermite of both guides' jets plus its bump `f B(xi)`
 * (`AutoMovieHumanPolarSector`), and `f` is solved so the quintic passes
 * through the conic's shoulder point at its polar angle `atan2(b, a)`. So
 * every quarter is the conic's touch, curvature and shoulder carried by a
 * quintic that is C2 across every guide; a raw conic arc would meet its
 * neighbour only C1, and a quarter superellipse of exponent above 2 has zero
 * curvature at its guide, a flat stripe along it.
 *
 * Reach. A shoulder is valid when the section stays star-shaped (a positive
 * radius), convex (the taut tape lies on it) and inside its box (the outlines
 * stay its extremes). Under that, the taut-tape girth is the section's length
 * and rises with the shoulder; the box bounds it between `2 sqrt(W^2 + D^2)`
 * (the rhombus) and `2 (W + D)` (the rectangle), `W` and `D` the box's
 * breadth and depth, and the quintic reaches the open part of that range its
 * valid shoulders span ({@link range}).
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

    /** Each quarter's bump amplitude in `AutoMovieHumanPolarSector`'s sense, mm. */
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

    // Each bump puts the quintic through its conic's shoulder point.
    const zero: number[] = [0, 0, 0, 0];
    const fullness: Quarters<number> = [0, 1, 2, 3].map((q: number): number => {
      const a: number = e[q]!;
      const b: number = e[(q + 1) % 4]!;
      const xi: number = Math.atan2(b, a) / QUARTER;
      const target: number = ((1 + shoulders[q]!) * Math.hypot(a, b)) / 2;
      const hermite: number = AutoMovieHumanPolarSector.radius(guides, zero, guides[q]!.angle + xi * QUARTER)[0];
      return (target - hermite) / bump(xi);
    }) as Quarters<number>;

    const section: ISection = { box, shoulders: [...shoulders], guides, fullness, girth: 0, diagonals: [0, 0, 0, 0] };
    section.diagonals = [0, 1, 2, 3].map(
      (q: number): number => radius(section, guides[q]!.angle + Math.atan2(e[(q + 1) % 4]!, e[q]!))[0],
    ) as Quarters<number>;
    section.girth = length(section);
    return section;
  }

  /**
   * The radius and its two angle derivatives at a chart angle.
   *
   * @param section The section.
   * @param phi Angle from `+u` toward `+v`, radians.
   * @returns `[rho, rho_phi, rho_phiphi]`.
   */
  export function radius(section: ISection, phi: number): AutoMovieHumanPolarSector.Jet {
    return AutoMovieHumanPolarSector.radius(section.guides, section.fullness, phi);
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
      const section: ISection = of(box, s);
      return fault(section) === null ? section : null;
    };
    if (at(ELLIPSE) === null) return null;
    const edge = (inside: number, outside: number): number => {
      let a: number = inside;
      let b: number = outside;
      for (let i: number = 0; i < BISECTIONS; i++) {
        const m: number = (a + b) / 2;
        if (at(m) !== null) a = m;
        else b = m;
      }
      return a;
    };
    const lo: number = edge(ELLIPSE, 0);
    const hi: number = edge(ELLIPSE, 1);
    return { shoulder: [lo, hi], girth: [at(lo)!.girth, at(hi)!.girth] };
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

/** `64 xi^3 (1 - xi)^3`, the polar sector's bump. */
function bump(xi: number): number {
  return 64 * xi ** 3 * (1 - xi) ** 3;
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

/** Halvings of the shoulder interval for the range's ends, to `2^-48` of a share. */
const BISECTIONS: number = 48;

/** Accepted girth error of the solve, mm: a thousandth of a micrometre. */
const GIRTH_TOLERANCE: number = 1e-6;

/** Most Illinois steps of the girth solve. */
const ITERATIONS: number = 100;
