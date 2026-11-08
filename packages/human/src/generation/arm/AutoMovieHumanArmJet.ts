/**
 * Second-order forward-mode jets for the arm's posed course
 * (`AutoMovieHumanArmF1Pose`): a scalar jet is a value with its first and
 * second derivatives in one parameter, `[f, f', f'']`, and every operation
 * applies the exact chain and product rules (Leibniz to second order), so a
 * law written once on jets yields its value and its analytic derivatives
 * together, with rounding error only (Griewank and Walther 2008, Evaluating
 * Derivatives, ch. 13, univariate Taylor propagation). A vector jet is three
 * scalar jets.
 */
export namespace AutoMovieHumanArmJet {
  /** A scalar jet `[f, f', f'']`. */
  export type J = [number, number, number];

  /** A vector jet, one scalar jet per component. */
  export type V = [J, J, J];

  /** A constant. */
  export function c(x: number): J {
    return [x, 0, 0];
  }

  /** The parameter itself at `x`, scaled by `slope` (its derivative in the caller's parameter). */
  export function seed(x: number, slope: number = 1): J {
    return [x, slope, 0];
  }

  /** Sum. */
  export function add(a: J, b: J): J {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference. */
  export function sub(a: J, b: J): J {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** A jet times a constant. */
  export function scale(a: J, k: number): J {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /** Product: `(fg)'' = f''g + 2f'g' + fg''`. */
  export function mul(a: J, b: J): J {
    return [a[0] * b[0], a[1] * b[0] + a[0] * b[1], a[2] * b[0] + 2 * a[1] * b[1] + a[0] * b[2]];
  }

  /** A smooth function of a jet, given the function's value and its first two derivatives at the jet's value: `[f, f1 a', f2 a'^2 + f1 a'']`. */
  export function apply(a: J, f: number, f1: number, f2: number): J {
    return [f, f1 * a[1], f2 * a[1] * a[1] + f1 * a[2]];
  }

  /** Quotient. */
  export function div(a: J, b: J): J {
    return mul(a, apply(b, 1 / b[0], -1 / (b[0] * b[0]), 2 / (b[0] * b[0] * b[0])));
  }

  /** Square root. */
  export function sqrt(a: J): J {
    const r: number = Math.sqrt(a[0]);
    return apply(a, r, 1 / (2 * r), -1 / (4 * r * a[0]));
  }

  /** Sine. */
  export function sin(a: J): J {
    return apply(a, Math.sin(a[0]), Math.cos(a[0]), -Math.sin(a[0]));
  }

  /** Cosine. */
  export function cos(a: J): J {
    return apply(a, Math.cos(a[0]), -Math.sin(a[0]), -Math.cos(a[0]));
  }

  /** Smoothstep `t^2 (3 - 2t)` of a jet clamped to [0, 1] (constant outside). */
  export function smooth(a: J): J {
    const t: number = a[0];
    if (t <= 0) return c(0);
    if (t >= 1) return c(1);
    return apply(a, t * t * (3 - 2 * t), 6 * t - 6 * t * t, 6 - 12 * t);
  }

  /** A jet clamped to [0, 1] (constant outside). */
  export function clamp(a: J): J {
    return a[0] <= 0 ? c(0) : a[0] >= 1 ? c(1) : a;
  }

  /** A constant vector. */
  export function vc(v: readonly [number, number, number]): V {
    return [c(v[0]), c(v[1]), c(v[2])];
  }

  /** Vector sum. */
  export function vadd(a: V, b: V): V {
    return [add(a[0], b[0]), add(a[1], b[1]), add(a[2], b[2])];
  }

  /** Vector difference. */
  export function vsub(a: V, b: V): V {
    return [sub(a[0], b[0]), sub(a[1], b[1]), sub(a[2], b[2])];
  }

  /** A vector jet times a scalar jet. */
  export function vmul(a: V, s: J): V {
    return [mul(a[0], s), mul(a[1], s), mul(a[2], s)];
  }

  /** A constant vector times a scalar jet. */
  export function cmul(a: readonly [number, number, number], s: J): V {
    return [scale(s, a[0]), scale(s, a[1]), scale(s, a[2])];
  }

  /** A vector jet times a constant. */
  export function vscale(a: V, k: number): V {
    return [scale(a[0], k), scale(a[1], k), scale(a[2], k)];
  }

  /** Dot product. */
  export function dot(a: V, b: V): J {
    return add(add(mul(a[0], b[0]), mul(a[1], b[1])), mul(a[2], b[2]));
  }

  /** Cross product. */
  export function cross(a: V, b: V): V {
    return [sub(mul(a[1], b[2]), mul(a[2], b[1])), sub(mul(a[2], b[0]), mul(a[0], b[2])), sub(mul(a[0], b[1]), mul(a[1], b[0]))];
  }

  /** The unit vector. */
  export function unit(a: V): V {
    return vmul(a, div(c(1), sqrt(dot(a, a))));
  }

  /** The values of a vector jet. */
  export function value(a: V): [number, number, number] {
    return [a[0][0], a[1][0], a[2][0]];
  }

  /** The first derivatives of a vector jet. */
  export function first(a: V): [number, number, number] {
    return [a[0][1], a[1][1], a[2][1]];
  }

  /** The second derivatives of a vector jet. */
  export function second(a: V): [number, number, number] {
    return [a[0][2], a[1][2], a[2][2]];
  }
}
