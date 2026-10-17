import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Binary64 operations for the original cubic arm section/tensor equations. */
export namespace ArmCurveMath {
  /** Add two vectors in the same chart and units. */
  export const add: (a: C.Vector, b: C.Vector) => C.Vector = (
    a: C.Vector,
    b: C.Vector,
  ): C.Vector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  /** Multiply each component by a scalar; dimensional conversion is owned by the caller. */
  export const scale: (a: C.Vector, s: number) => C.Vector = (
    a: C.Vector,
    s: number,
  ): C.Vector => [a[0] * s, a[1] * s, a[2] * s];

  /** Subtract vectors without changing frame or component order. */
  export const sub: (a: C.Vector, b: C.Vector) => C.Vector = (
    a: C.Vector,
    b: C.Vector,
  ): C.Vector => add(a, scale(b, -1));

  /** Euclidean scalar product; the result has the product of its input units. */
  export const dot: (a: C.Vector, b: C.Vector) => number = (
    a: C.Vector,
    b: C.Vector,
  ): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  /** Euclidean length, preserving the vector's units. */
  export const norm: (a: C.Vector) => number = (a: C.Vector): number =>
    Math.hypot(...a);

  /** Normalize a finite nonzero vector; zero, nonfinite and unresolved lengths throw before division. */
  export const unit: (a: C.Vector) => C.Vector = (a: C.Vector): C.Vector => {
    const length: number = norm(a);
    if (!Number.isFinite(length) || length <= 0)
      throw new Error("A nonzero finite vector is required");
    return scale(a, 1 / length);
  };

  /** Apply a row-major 3-by-3 linear map; translations are separate. */
  export const mul: (matrix: C.Matrix, a: C.Vector) => C.Vector = (
    matrix: C.Matrix,
    a: C.Vector,
  ): C.Vector =>
    matrix.map((row: C.Vector): number => dot(row, a)) as unknown as C.Vector;

  /** Exchange the rows and columns of a 3-by-3 matrix without asserting orthogonality. */
  export const transpose: (matrix: C.Matrix) => C.Matrix = (
    matrix: C.Matrix,
  ): C.Matrix =>
    [0, 1, 2].map(
      (i: number): C.Vector =>
        matrix.map((row: C.Vector): number => row[i]!) as unknown as C.Vector,
    ) as unknown as C.Matrix;

  /** Compose row-major linear maps as a*b, so b acts first. */
  export const product: (a: C.Matrix, b: C.Matrix) => C.Matrix = (
    a: C.Matrix,
    b: C.Matrix,
  ): C.Matrix =>
    transpose(
      transpose(b).map(
        (column: C.Vector): C.Vector => mul(a, column),
      ) as unknown as C.Matrix,
    );

  /** Map every control while preserving angular span and within-span indices. */
  export const mapNet: (
    net: readonly C.Span[],
    fn: (v: C.Vector, i: number, j: number) => C.Vector,
  ) => C.Span[] = (
    net: readonly C.Span[],
    fn: (v: C.Vector, i: number, j: number) => C.Vector,
  ): C.Span[] =>
    net.map(
      (span: C.Span, i: number): C.Span =>
        span.map(
          (v: C.Vector, j: number): C.Vector => fn(v, i, j),
        ) as unknown as C.Span,
    );

  /** Componentwise (a-b)/divisor; matching net shapes and a nonzero physical divisor are caller preconditions. */
  export const difference: (
    a: readonly C.Span[],
    b: readonly C.Span[],
    divisor: number,
  ) => C.Span[] = (
    a: readonly C.Span[],
    b: readonly C.Span[],
    divisor: number,
  ): C.Span[] =>
    mapNet(
      a,
      (p: C.Vector, i: number, j: number): C.Vector =>
        scale(sub(p, b[i]![j]!), 1 / divisor),
    );

  /** Componentwise a+factor*b; Hermite construction uses millimetres times a dP/dmm net to obtain handle positions. */
  export const combine: (
    a: readonly C.Span[],
    b: readonly C.Span[],
    factor: number,
  ) => C.Span[] = (
    a: readonly C.Span[],
    b: readonly C.Span[],
    factor: number,
  ): C.Span[] =>
    mapNet(
      a,
      (p: C.Vector, i: number, j: number): C.Vector =>
        add(p, scale(b[i]![j]!, factor)),
    );

  /** Evaluate one cubic in Bernstein form at its local dimensionless parameter; callers supply four controls and their intended domain. */
  export const cubic: (span: C.Span, t: number) => C.Vector = (
    span: C.Span,
    t: number,
  ): C.Vector => {
    const b: number[] = [
      (1 - t) ** 3,
      3 * (1 - t) ** 2 * t,
      3 * (1 - t) * t ** 2,
      t ** 3,
    ];
    return [0, 1, 2].map((k: number): number =>
      b.reduce(
        (sum: number, value: number, i: number): number =>
          sum + value * span[i]![k]!,
        0,
      ),
    ) as unknown as C.Vector;
  };

  /** Evaluate four equal quarter spans at phase in [0,1] turns; phase one uses the final span endpoint. */
  export const angular: (net: readonly C.Span[], phase: number) => C.Vector = (
    net: readonly C.Span[],
    phase: number,
  ): C.Vector => {
    const i: number = Math.min(Math.floor(phase * 4), 3);
    return cubic(net[i]!, phase * 4 - i);
  };

  /** Shift a four-span loop by half a turn without reversing winding, restoring the right wrist owner's pole order when applied twice. */
  export const rotateQuarters: (net: readonly C.Span[]) => C.Span[] = (
    net: readonly C.Span[],
  ): C.Span[] => [...net.slice(2), ...net.slice(0, 2)];
}
