/**
 * Scalar continuous extensions shared by trajectory construction and reads.
 *
 * The quartic is the existing DOPRI5 nested extension. An optional fifth
 * coefficient gives its quintic Hermite-Birkhoff extension. The two interior
 * derivative nodes are Enright and Hayes (2007), section 2.2, equations 13:
 * https://www.cs.toronto.edu/~wayne/research/papers/enright.pdf.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the original quartic, the quintic extension, dimensionless share and physical derivative units.
 * @evidence contracts/development/design.md#principled-representation Coefficients describe one scalar increment from a step's start; both four- and five-coefficient curves retain their endpoint values and slopes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Dense readers and the paired continuous-defect builder share value, slope and the two-node quintic construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The interior nodes come from the cited continuous Runge-Kutta method rather than a scene grid or observed failure.
 */
export namespace MotionTrajectoryPolynomial {
  /** The cited two additional derivative nodes, as exact rational inputs. */
  export const NODES: readonly [number, number] = [43 / 50, 93 / 100];

  /** Derivative weights of u²(1-u)² and u³(1-u)² at the first node. */
  const first: readonly [number, number] = weights(NODES[0]);

  /** The same derivative weights at the second node. */
  const second: readonly [number, number] = weights(NODES[1]);

  /** Nonzero determinant of the two distinct interior derivative constraints. */
  const determinant: number = first[0] * second[1] - first[1] * second[0];

  /**
   * Read an increment at share u, preserving the original quartic association.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Coefficients and output share the scalar state's unit; u is dimensionless.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates u*a+u(1-u)b+u²(1-u)c+u²(1-u)²(d+u*e) in nested form; omitted e uses the original quartic expression exactly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select quartic or quintic nested evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamping, quantization or replacement curve is applied.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One formula serves every vector and rotation component.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no input.
   */
  export function value(
    u: number, a: number, b: number, c: number, d: number, e?: number,
  ): number {
    const w: number = 1 - u;
    return e === undefined
      ? u * (a + w * (b + u * (c + w * d)))
      : u * (a + w * (b + u * (c + w * (d + u * e))));
  }

  /**
   * Differentiate that same increment with respect to its dimensionless share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The result is per share; callers divide by the physical step in seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Analytically differentiates the four polynomial basis terms and the optional u³(1-u)² term.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Form powers once and sum each coefficient's derivative weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not difference sampled orientations or invoke a physical model.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The derivative uses precisely value's polynomial coefficients.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number without retention.
   */
  export function slope(
    u: number, a: number, b: number, c: number, d: number, e?: number,
  ): number {
    const u2: number = u * u;
    const u3: number = u2 * u;
    const base: number = a + (1 - 2 * u) * b + (2 * u - 3 * u2) * c
      + (2 * u - 6 * u2 + 4 * u3) * d;
    return e === undefined ? base : base + (3 * u2 - 8 * u3 + 5 * u3 * u) * e;
  }

  /**
   * Complete a C1 cubic with the cited two interior derivatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation a,b,c retain endpoint increment/slopes; firstRate and secondRate are derivatives per share at NODES.
   * @evidence contracts/development/implementation.md#principled-implementation The two free quintic coefficients multiply u²(1-u)² and u³(1-u)², preserving endpoint values and derivatives. Solves their two-by-two derivative constraints at the distinct cited nodes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Subtract the cubic's derivative at each node and solve the fixed linear system.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fitted fixture coefficient or extra endpoint approximation enters the constraints.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work and one five-number output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same fixed node weights and determinant serve every component and both paired extensions.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh coefficient array escapes; no callback or model is retained.
   */
  export function fit(
    a: number, b: number, c: number, firstRate: number, secondRate: number,
  ): number[] {
    const left: number = firstRate - slope(NODES[0], a, b, c, 0);
    const right: number = secondRate - slope(NODES[1], a, b, c, 0);
    return [a, b, c,
      (left * second[1] - right * first[1]) / determinant,
      (first[0] * right - second[0] * left) / determinant];
  }

  /** The two endpoint-vanishing basis functions' derivative weights. */
  function weights(u: number): readonly [number, number] {
    const u2: number = u * u;
    const u3: number = u2 * u;
    return [2 * u - 6 * u2 + 4 * u3, 3 * u2 - 8 * u3 + 5 * u3 * u];
  }
}
