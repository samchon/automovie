/** Shared scalar and forward-mode spatial arithmetic for binding fields. */
export namespace AutoMovieHumanWeightJet {
  /** Registered-frame gradient. */
  export type Vector = [number, number, number];
  /** A scalar value with an optional spatial jet. */
  export type Scalar = number | { value: number; gradient: Vector };
  /** Numeric value of a dual scalar. */
  export function value(a: Scalar): number { return typeof a === "number" ? a : a.value; }

  /** Spatial derivative, zero for a constant. */
  export function gradient(a: Scalar): Vector { return typeof a === "number" ? [0, 0, 0] : a.gradient; }

  /** Sum preserving the derivative. */
  export function add(a: Scalar, b: Scalar): Scalar { return binary(a, b, value(a) + value(b), 1, 1); }

  /** Difference preserving the derivative. */
  export function sub(a: Scalar, b: Scalar): Scalar { return binary(a, b, value(a) - value(b), 1, -1); }

  /** Product rule. */
  export function mul(a: Scalar, b: Scalar): Scalar { return binary(a, b, value(a) * value(b), value(b), value(a)); }

  /** Quotient rule. */
  export function div(a: Scalar, b: Scalar): Scalar { return binary(a, b, value(a) / value(b), 1 / value(b), -value(a) / value(b) ** 2); }

  /** C1 compact cubic partition, with slope at most 1.5 on [0,1]. */
  export function rise(a: Scalar): Scalar {
    if (value(a) <= 0) return 0;
    if (value(a) >= 1) return 1;
    return mul(mul(a, a), sub(3, mul(2, a)));
  }

  /** Plane profile, centred on zero. */
  export function ramp(a: Scalar): Scalar { return rise(mul(add(a, 1), 0.5)); }

  /** Clamp a capsule's longitudinal coordinate with its actual endpoint jet. */
  export function clamp(a: Scalar): Scalar { return value(a) <= 0 ? 0 : value(a) >= 1 ? 1 : a; }

  /** Linear combination of two derivatives. */
  function binary(a: Scalar, b: Scalar, v: number, da: number, db: number): Scalar {
    if (typeof a === "number" && typeof b === "number") return v;
    const x: Vector = gradient(a);
    const y: Vector = gradient(b);
    return { value: v, gradient: [da * x[0] + db * y[0], da * x[1] + db * y[1], da * x[2] + db * y[2]] };
  }

  /** Euclidean norm; a non-constant centreline has no radial jet and is refused. */
  export function norm(a: Scalar[]): Scalar {
    const squared: Scalar = a.reduce((s: Scalar, x: Scalar): Scalar => add(s, mul(x, x)), 0);
    const length: number = Math.sqrt(value(squared));
    if (length === 0) {
      if (a.some((x: Scalar): boolean => typeof x !== "number" && x.gradient.some((g: number): boolean => g !== 0)))
        throw new Error("A capsule centreline has no radial derivative");
      return 0;
    }
    return binary(squared, 0, length, 0.5 / length, 0);
  }

  /** Dot product against a fixed vector. */
  export function dot(a: Scalar[], b: Vector): Scalar { return a.reduce((s: Scalar, x: Scalar, i: number): Scalar => add(s, mul(x, b[i]!)), 0); }


}
