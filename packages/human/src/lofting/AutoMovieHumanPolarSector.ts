import { AutoMovieHumanSeam } from "./AutoMovieHumanSeam";
import type { IAutoMovieHumanSeam } from "./IAutoMovieHumanSeam";

/**
 * A closed section about an axis point as a radius in the polar angle, built
 * from guides and the sectors between them (rule J2's sector fill).
 *
 * A guide stands at a fixed angle and owns the radius there and its first
 * and second angle derivatives `(rho, rho_phi, rho_phiphi)`. A sector between
 * two guides `a` and `b` of angular width `D` is, in the share
 * `xi = (phi - phi_a) / D`, the quintic Hermite of both guides' values
 *
 * ```text
 * rho = H0 rho_a + H1 D rho'_a + H2 D^2 rho''_a
 *     + H3 rho_b + H4 D rho'_b + H5 D^2 rho''_b + f B(xi)
 * ```
 *
 * plus the sector's own fullness `f` times `B = 64 xi^3 (1 - xi)^3`, which
 * vanishes with its first and second derivatives at both guides and is 1 at
 * the sector's middle. So the radius is C2 across every guide whatever the
 * sectors' fullness, each sector keeps one number of its own, and the guide's
 * jet is the point, tangent and curvature it publishes
 * ({@link publish}). A quarter superellipse would put zero curvature on the
 * guide; here the guide's curvature is whatever its `rho_phiphi` says.
 *
 * Angles are radians and run counter-clockwise in the section's own
 * `(x, z)` chart: the point at `phi` is `rho (cos phi, sin phi)`.
 */
export namespace AutoMovieHumanPolarSector {
  /** A guide: a fixed angle owning the radius and its two angle derivatives. */
  export interface IGuide {
    /** Polar angle, radians. */
    angle: number;

    /** Radius. */
    value: number;

    /** First derivative of the radius in the angle. */
    slope: number;

    /** Second derivative of the radius in the angle. */
    curvature: number;
  }

  /** A radius and its first and second angle derivatives. */
  export type Jet = [number, number, number];

  /**
   * The radius at an angle and its two angle derivatives.
   *
   * @param guides Guides by increasing angle within one turn, at least two;
   *   the last sector runs from the last guide round to the first.
   * @param fullness One per guide: sector j follows guide j.
   * @param phi Angle, any real value.
   */
  export function radius(
    guides: readonly IGuide[],
    fullness: readonly number[],
    phi: number,
  ): Jet {
    if (guides.length < 2 || fullness.length !== guides.length)
      throw new Error("A polar section needs two guides and one fullness per sector");
    const n: number = guides.length;
    const at: number = wrap(phi - guides[0]!.angle) + guides[0]!.angle;
    let j: number = n - 1;
    for (let k: number = 0; k + 1 < n; k++)
      if (at < guides[k + 1]!.angle) {
        j = k;
        break;
      }
    const a: IGuide = guides[j]!;
    const b: IGuide = guides[(j + 1) % n]!;
    const width: number = j + 1 < n ? b.angle - a.angle : b.angle + TWO_PI - a.angle;
    if (!(width > 0)) throw new Error("Polar guides must increase within one turn");
    return sector(a, b, width, fullness[j]!, (at - a.angle) / width);
  }

  /**
   * The fullness that puts a sector's middle at a radius: the inverse of the
   * sector rule at `xi = 1/2`, where `B` is 1.
   */
  export function fullnessAt(a: IGuide, b: IGuide, width: number, middle: number): number {
    return middle - sector(a, b, width, 0, 0.5)[0];
  }

  /**
   * A point of the section and its first and second derivatives in the angle,
   * in the section's `(x, z)` chart, for a radius jet: `p = rho e`,
   * `p' = rho' e + rho e_perp`, `p'' = (rho'' - rho) e + 2 rho' e_perp`.
   */
  export function point(jet: Jet, phi: number): [number[], number[], number[]] {
    const [r, r1, r2] = jet;
    const c: number = Math.cos(phi);
    const s: number = Math.sin(phi);
    return [
      [r * c, r * s],
      [r1 * c - r * s, r1 * s + r * c],
      [(r2 - r) * c - 2 * r1 * s, (r2 - r) * s + 2 * r1 * c],
    ];
  }

  /** A guide's published jet by arclength in the section's chart (rule J1). */
  export function publish(guide: IGuide, scale: number = 1): IAutoMovieHumanSeam.IArcJet {
    const [p, d1, d2] = point(
      [scale * guide.value, scale * guide.slope, scale * guide.curvature],
      guide.angle,
    );
    return AutoMovieHumanSeam.publish(p, d1, d2);
  }

  /** One sector's radius jet at share `xi` of its width. */
  function sector(a: IGuide, b: IGuide, width: number, full: number, xi: number): Jet {
    const D: number = width;
    const w: number[][] = [0, 1, 2].map((k: number): number[] => BASIS.map((p: readonly number[]): number => poly(p, xi, k)));
    const bump: number[] = [0, 1, 2].map((k: number): number => poly(BUMP, xi, k));
    const values: number[] = [a.value, D * a.slope, D * D * a.curvature, b.value, D * b.slope, D * D * b.curvature];
    const out: Jet = [0, 0, 0];
    for (let k: number = 0; k < 3; k++) {
      let v: number = full * bump[k]!;
      for (let i: number = 0; i < 6; i++) v += w[k]![i]! * values[i]!;
      out[k] = v / D ** k;
    }
    return out;
  }
}

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

/** Angle reduced to `[0, 2 pi)`. */
function wrap(t: number): number {
  const r: number = t % TWO_PI;
  return r < 0 ? r + TWO_PI : r;
}

/**
 * The quintic Hermite basis on `[0, 1]` as polynomial coefficients from the
 * constant term: value, first and second derivative at 0, then at 1.
 */
const BASIS: readonly (readonly number[])[] = [
  [1, 0, 0, -10, 15, -6],
  [0, 1, 0, -6, 8, -3],
  [0, 0, 0.5, -1.5, 1.5, -0.5],
  [0, 0, 0, 10, -15, 6],
  [0, 0, 0, -4, 7, -3],
  [0, 0, 0, 0.5, -1, 0.5],
];

/** `64 xi^3 (1 - xi)^3`: zero with two derivatives at both ends, 1 at the middle. */
const BUMP: readonly number[] = [0, 0, 0, 64, -192, 192, -64];

/** A polynomial's k-th derivative at x, coefficients from the constant term. */
function poly(c: readonly number[], x: number, k: number): number {
  let sum: number = 0;
  for (let i: number = k; i < c.length; i++) {
    let f: number = 1;
    for (let j: number = 0; j < k; j++) f *= i - j;
    sum += f * c[i]! * x ** (i - k);
  }
  return sum;
}
