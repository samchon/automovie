import type {
  AutoMovieScalarJet2,
  AutoMovieVector3Jet2,
  AutoMovieVector3Tuple,
} from "@automovie/interface";

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
  /** A constant. */
  export function c(x: number): AutoMovieScalarJet2 {
    return [x, 0, 0];
  }

  /** The parameter itself at `x`, scaled by `slope` (its derivative in the caller's parameter). */
  export function seed(x: number, slope: number = 1): AutoMovieScalarJet2 {
    return [x, slope, 0];
  }

  /** Sum. */
  export function add(
    a: AutoMovieScalarJet2,
    b: AutoMovieScalarJet2,
  ): AutoMovieScalarJet2 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference. */
  export function sub(
    a: AutoMovieScalarJet2,
    b: AutoMovieScalarJet2,
  ): AutoMovieScalarJet2 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** A jet times a constant. */
  export function scale(
    a: AutoMovieScalarJet2,
    k: number,
  ): AutoMovieScalarJet2 {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /** Product: `(fg)'' = f''g + 2f'g' + fg''`. */
  export function mul(
    a: AutoMovieScalarJet2,
    b: AutoMovieScalarJet2,
  ): AutoMovieScalarJet2 {
    return [
      a[0] * b[0],
      a[1] * b[0] + a[0] * b[1],
      a[2] * b[0] + 2 * a[1] * b[1] + a[0] * b[2],
    ];
  }

  /** A smooth function of a jet, given the function's value and its first two derivatives at the jet's value: `[f, f1 a', f2 a'^2 + f1 a'']`. */
  export function apply(
    a: AutoMovieScalarJet2,
    f: number,
    f1: number,
    f2: number,
  ): AutoMovieScalarJet2 {
    return [f, f1 * a[1], f2 * a[1] * a[1] + f1 * a[2]];
  }

  /** Quotient. */
  export function div(
    a: AutoMovieScalarJet2,
    b: AutoMovieScalarJet2,
  ): AutoMovieScalarJet2 {
    return mul(
      a,
      apply(b, 1 / b[0], -1 / (b[0] * b[0]), 2 / (b[0] * b[0] * b[0])),
    );
  }

  /** Square root. */
  export function sqrt(a: AutoMovieScalarJet2): AutoMovieScalarJet2 {
    const r: number = Math.sqrt(a[0]);
    return apply(a, r, 1 / (2 * r), -1 / (4 * r * a[0]));
  }

  /** Sine. */
  export function sin(a: AutoMovieScalarJet2): AutoMovieScalarJet2 {
    return apply(a, Math.sin(a[0]), Math.cos(a[0]), -Math.sin(a[0]));
  }

  /** Cosine. */
  export function cos(a: AutoMovieScalarJet2): AutoMovieScalarJet2 {
    return apply(a, Math.cos(a[0]), -Math.sin(a[0]), -Math.cos(a[0]));
  }

  /** Smoothstep `t^2 (3 - 2t)` of a jet clamped to [0, 1] (constant outside). */
  export function smooth(a: AutoMovieScalarJet2): AutoMovieScalarJet2 {
    const t: number = a[0];
    if (t <= 0) return c(0);
    if (t >= 1) return c(1);
    return apply(a, t * t * (3 - 2 * t), 6 * t - 6 * t * t, 6 - 12 * t);
  }

  /** A jet clamped to [0, 1] (constant outside). */
  export function clamp(a: AutoMovieScalarJet2): AutoMovieScalarJet2 {
    return a[0] <= 0 ? c(0) : a[0] >= 1 ? c(1) : a;
  }

  /** A constant vector. */
  export function vc(v: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Jet2 {
    return [c(v[0]), c(v[1]), c(v[2])];
  }

  /** Vector sum. */
  export function vadd(
    a: AutoMovieVector3Jet2,
    b: AutoMovieVector3Jet2,
  ): AutoMovieVector3Jet2 {
    return [add(a[0], b[0]), add(a[1], b[1]), add(a[2], b[2])];
  }

  /** Vector difference. */
  export function vsub(
    a: AutoMovieVector3Jet2,
    b: AutoMovieVector3Jet2,
  ): AutoMovieVector3Jet2 {
    return [sub(a[0], b[0]), sub(a[1], b[1]), sub(a[2], b[2])];
  }

  /** A vector jet times a scalar jet. */
  export function vmul(
    a: AutoMovieVector3Jet2,
    s: AutoMovieScalarJet2,
  ): AutoMovieVector3Jet2 {
    return [mul(a[0], s), mul(a[1], s), mul(a[2], s)];
  }

  /** A constant vector times a scalar jet. */
  export function cmul(
    a: Readonly<AutoMovieVector3Tuple>,
    s: AutoMovieScalarJet2,
  ): AutoMovieVector3Jet2 {
    return [scale(s, a[0]), scale(s, a[1]), scale(s, a[2])];
  }

  /** A vector jet times a constant. */
  export function vscale(
    a: AutoMovieVector3Jet2,
    k: number,
  ): AutoMovieVector3Jet2 {
    return [scale(a[0], k), scale(a[1], k), scale(a[2], k)];
  }

  /** Dot product. */
  export function dot(
    a: AutoMovieVector3Jet2,
    b: AutoMovieVector3Jet2,
  ): AutoMovieScalarJet2 {
    return add(add(mul(a[0], b[0]), mul(a[1], b[1])), mul(a[2], b[2]));
  }

  /** Cross product. */
  export function cross(
    a: AutoMovieVector3Jet2,
    b: AutoMovieVector3Jet2,
  ): AutoMovieVector3Jet2 {
    return [
      sub(mul(a[1], b[2]), mul(a[2], b[1])),
      sub(mul(a[2], b[0]), mul(a[0], b[2])),
      sub(mul(a[0], b[1]), mul(a[1], b[0])),
    ];
  }

  /** The unit vector. */
  export function unit(a: AutoMovieVector3Jet2): AutoMovieVector3Jet2 {
    return vmul(a, div(c(1), sqrt(dot(a, a))));
  }

  /** The values of a vector jet. */
  export function value(a: AutoMovieVector3Jet2): AutoMovieVector3Tuple {
    return [a[0][0], a[1][0], a[2][0]];
  }

  /** The first derivatives of a vector jet. */
  export function first(a: AutoMovieVector3Jet2): AutoMovieVector3Tuple {
    return [a[0][1], a[1][1], a[2][1]];
  }

  /** The second derivatives of a vector jet. */
  export function second(a: AutoMovieVector3Jet2): AutoMovieVector3Tuple {
    return [a[0][2], a[1][2], a[2][2]];
  }
}
