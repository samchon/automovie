/*
 * Scalar continuous extensions shared by trajectory construction and reads.
 *
 * The quartic is the existing DOPRI5 nested extension. An optional fifth
 * coefficient gives its quintic Hermite-Birkhoff extension. The two interior
 * derivative nodes are Enright and Hayes (2007), section 2.2, equations 13:
 * https://www.cs.toronto.edu/~wayne/research/papers/enright.pdf.
 */
export namespace MotionTrajectoryPolynomial {
  /*
   * The cited two additional derivative nodes, as exact rational inputs.
   */
  export const NODES: readonly [number, number] = [43 / 50, 93 / 100];

  /*
   * Read an increment at share u, preserving the original quartic association.
   */
  export function value(
    u: number,
    a: number,
    b: number,
    c: number,
    d: number,
    e?: number,
  ): number {
    const w: number = 1 - u;
    return e === undefined
      ? u * (a + w * (b + u * (c + w * d)))
      : u * (a + w * (b + u * (c + w * (d + u * e))));
  }

  /*
   * Differentiate that same increment with respect to its dimensionless share.
   */
  export function slope(
    u: number,
    a: number,
    b: number,
    c: number,
    d: number,
    e?: number,
  ): number {
    const u2: number = u * u;
    const u3: number = u2 * u;
    const base: number =
      a +
      (1 - 2 * u) * b +
      (2 * u - 3 * u2) * c +
      (2 * u - 6 * u2 + 4 * u3) * d;
    return e === undefined ? base : base + (3 * u2 - 8 * u3 + 5 * u3 * u) * e;
  }

  /*
   * Complete a C1 cubic with the cited two interior derivatives.
   */
  export function fit(
    a: number,
    b: number,
    c: number,
    firstRate: number,
    secondRate: number,
  ): number[] {
    const left: number = firstRate - slope(NODES[0], a, b, c, 0);
    const right: number = secondRate - slope(NODES[1], a, b, c, 0);
    return [
      a,
      b,
      c,
      (left * second[1] - right * first[1]) / determinant,
      (first[0] * right - second[0] * left) / determinant,
    ];
  }

  /*
   * Derivative weights of u²(1-u)² and u³(1-u)² at the first node.
   */
  const first: readonly [number, number] = weights(NODES[0]);

  /*
   * The same derivative weights at the second node.
   */
  const second: readonly [number, number] = weights(NODES[1]);

  /*
   * Nonzero determinant of the two distinct interior derivative constraints.
   */
  const determinant: number = first[0] * second[1] - first[1] * second[0];

  /*
   * The two endpoint-vanishing basis functions' derivative weights.
   */
  function weights(u: number): readonly [number, number] {
    const u2: number = u * u;
    const u3: number = u2 * u;
    return [2 * u - 6 * u2 + 4 * u3, 3 * u2 - 8 * u3 + 5 * u3 * u];
  }
}
