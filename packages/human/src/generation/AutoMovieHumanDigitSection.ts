import { AutoMovieHumanSeamKnot } from "../lofting/AutoMovieHumanSeamKnot";
import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";

/**
 * A digit's section square to its bone: a palmar half and a dorsal half that
 * meet at the radial and ulnar side points (the digit's midlateral lines,
 * where palmar and dorsal skin meet), assembled as one periodic cubic B-spline
 * section by `AutoMovieHumanSeamKnot.assemble`.
 *
 * The section lies in its own frame: origin on the bone, `b` across the digit
 * toward the thumb's side, `n` toward the palm. Each side point is a guide
 * owning its point `(+-w, 0)`, its tangent along `n` and its curvature
 * `kappa_s`, the tightest turn of the section (`docs/techniques/
 * surface-composition.md`, Sectors and guides). Each half is its own sector:
 *
 * ```text
 * palmar, theta in [0, pi]:  (w cos theta,  h_p s_p(theta))
 * dorsal, theta in [0, pi]:  (-w cos theta, -h_d s_d(theta))
 * s(theta) = sin theta + a sin theta cos^2 theta + c sin theta cos^4 theta
 * ```
 *
 * `s(pi/2) = 1`, so each half reaches its depth `h` at its apex, with a level
 * tangent there. At a side point `x'' = -w` and `y' = h s'(0) = h (1 + a + c)`,
 * so its curvature is `w / (h s'(0))^2`: both halves meet the guide's speed
 * `lambda = sqrt(w / kappa_s)` and curvature exactly by taking
 * `s'(0) = lambda / h`. At the apex the curvature is `h (1 - 2a) / w^2`, the
 * ellipse's `h / w^2` times `rho = 1 - 2a`, so `a` sets the apex's flatness
 * and `c` the side's turn independently. Both halves join their guides with
 * tangential acceleration zero, as the guides publish, so the assembled ring
 * is the sectors' own curves at their knots and C2 everywhere.
 */
export namespace AutoMovieHumanDigitSection {
  /** A section's shape, millimetres and normalised constants. */
  export interface IShape {
    /** Half width across the digit, from the bone to either side point. */
    width: number;

    /** Depth of the palmar half from the bone to its apex. */
    palmar: number;

    /** Depth of the dorsal half from the bone to its apex. */
    dorsal: number;

    /** Curvature at the side points times the half width, `kappa_s w`. */
    side: number;

    /** Palmar apex curvature over the half ellipse's, `rho_p`. */
    palmarApex: number;

    /** Dorsal apex curvature over the half ellipse's, `rho_d`. */
    dorsalApex: number;
  }

  /**
   * The section's control points in its frame, `[b, n]` per control point,
   * phase `2 pi m / count` from the radial side point toward the palm.
   *
   * @param count Control points, a multiple of 2 with at least four spans per half.
   */
  export function controls(shape: IShape, count: number): [number, number][] {
    if (count % 2 !== 0 || count < 8)
      throw new Error(`A digit section needs an even count of at least 8, not ${count}`);
    const w: number = shape.width;
    const kappa: number = shape.side / w;
    const lambda: number = Math.sqrt(w / kappa);
    const palmar: IHalf = half(shape.palmar, w, lambda, shape.palmarApex, "palmar");
    const dorsal: IHalf = half(shape.dorsal, w, lambda, shape.dorsalApex, "dorsal");
    const guide = (knot: number, point: number[], tangent: number[], curvature: number[]): AutoMovieHumanSeamKnot.IGuide => ({
      knot,
      jet: { point, tangent, curvature } satisfies IAutoMovieHumanSeam.IArcJet,
      speed: lambda,
    });
    const flat: number[] = AutoMovieHumanSeamKnot.assemble(
      count,
      [
        guide(0, [w, 0], [0, 1], [-kappa, 0]),
        guide(count / 2, [-w, 0], [0, -1], [kappa, 0]),
      ],
      [
        { name: "palmar", jet: (t: number): AutoMovieHumanSeamKnot.Jet => palmar.jet(t, 1) },
        { name: "dorsal", jet: (t: number): AutoMovieHumanSeamKnot.Jet => dorsal.jet(t - Math.PI, -1) },
      ],
    );
    return Array.from({ length: count }, (_: unknown, m: number): [number, number] => [flat[m]!, flat[count + m]!]);
  }

  /**
   * Points of the section at its knots, `[b, n]`, phase `2 pi m / count`:
   * the uniform cubic B-spline of {@link controls} evaluated where an
   * interpolating consumer reads it back, so the guides' jets survive the
   * interpolation exactly.
   */
  export function knots(shape: IShape, count: number): [number, number][] {
    const p: [number, number][] = controls(shape, count);
    return p.map((q: [number, number], m: number): [number, number] => {
      const a: [number, number] = p[(m - 1 + count) % count]!;
      const b: [number, number] = p[(m + 1) % count]!;
      return [(a[0] + 4 * q[0] + b[0]) / 6, (a[1] + 4 * q[1] + b[1]) / 6];
    });
  }

  /**
   * The section's hull perimeter, mm, from its own curve sampled finely: the
   * tape a girth solve compares with its input.
   */
  export function girth(shape: IShape): number {
    const w: number = shape.width;
    const lambda: number = Math.sqrt(w / (shape.side / w));
    const palmar: IHalf = half(shape.palmar, w, lambda, shape.palmarApex, "palmar");
    const dorsal: IHalf = half(shape.dorsal, w, lambda, shape.dorsalApex, "dorsal");
    let sum: number = 0;
    let last: number[] | null = null;
    const steps: number = 256;
    for (let i: number = 0; i <= steps; i++) {
      const t: number = (2 * Math.PI * i) / steps;
      const p: number[] = t <= Math.PI ? palmar.jet(t, 1)[0] : dorsal.jet(t - Math.PI, -1)[0];
      if (last !== null) sum += Math.hypot(p[0]! - last[0]!, p[1]! - last[1]!);
      last = p;
    }
    return sum;
  }
}

/** One half's curve. */
interface IHalf {
  /** Jet at its own angle in `[0, pi]`; `sign` 1 palmar, -1 dorsal (both axes turned). */
  jet: (theta: number, sign: number) => AutoMovieHumanSeamKnot.Jet;
}

/**
 * A half of depth `h` and half width `w` whose side speed is `lambda` and whose apex curvature is
 * `rho` times the half ellipse's. Refused where the half would not stay
 * convex: `rho` outside (0, 1.5], or a side speed so far from the depth that
 * the profile turns back.
 */
function half(h: number, w: number, lambda: number, rho: number, name: string): IHalf {
  const a: number = (1 - rho) / 2;
  const c: number = lambda / h - 1 - a;
  if (!(h > 0) || !(rho > 0 && rho <= 1.5))
    throw new Error(`The ${name} half needs a positive depth and an apex share in (0, 1.5], not ${h} and ${rho}`);
  // s' must stay positive on (0, pi/2) for the profile to rise to its apex.
  for (let i: number = 0; i < 64; i++) {
    const t: number = ((i + 0.5) / 64) * (Math.PI / 2);
    if (!(derivative(t, a, c) > 0))
      throw new Error(`The ${name} half turns back: side speed ${lambda} over depth ${h} with apex share ${rho}`);
  }
  return {
    jet: (theta: number, sign: number): AutoMovieHumanSeamKnot.Jet => {
      const s: number = Math.sin(theta);
      const k: number = Math.cos(theta);
      const value: number = s + a * s * k * k + c * s * k ** 4;
      const first: number = derivative(theta, a, c);
      const second: number =
        -s + a * (-3 * k * k * s - 4 * s * k * k + 2 * s ** 3) + c * (-5 * k ** 4 * s - 8 * s * k ** 4 + 12 * s ** 3 * k * k);
      return [
        [sign * w * k, sign * h * value],
        [-sign * w * s, sign * h * first],
        [-sign * w * k, sign * h * second],
      ];
    },
  };
}

/** `s'(theta)`. */
function derivative(theta: number, a: number, c: number): number {
  const s: number = Math.sin(theta);
  const k: number = Math.cos(theta);
  return k + a * (k ** 3 - 2 * s * s * k) + c * (k ** 5 - 4 * s * s * k ** 3);
}

