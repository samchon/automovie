/**
 * Matrix-free projected Gauss–Newton step for interaction-mesh deformation.
 *
 * Li et al. 2020 §4.3's positive curvature term is a sum of local
 * outer products. Using the Laplacian and constraint Jacobians in the
 * same form supports a diagonally conditioned conjugate-gradient solve
 * without filling an all-point quadratic program.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the numerical step and the local outer-product representation.
 * @evidence contracts/development/design.md#principled-representation Sparse scalar rows act on the original Cartesian variables and hold only nonzero coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One linear Newton operation with one row representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts All rows contribute to the same iterate; the linear step neither clips positions nor asserts feasibility.
 */
export namespace HumanInteractionMeshStep {
  /**
   * A scalar objective's contribution along one sparse derivative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the coordinate, derivative and scalar energy terms.
   * @evidence contracts/development/design.md#principled-representation A sparse Jacobian row and its local energy slope and curvature.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used for the Laplacian, finite-weight constraints and active volume barriers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each coefficient comes from the actual current residual geometry.
   */
  export interface IRow {
    /** The indices of the included Cartesian components. */
    index: readonly number[];

    /** The scalar quantity's first derivative in each component. */
    coef: readonly number[];

    /** The energy derivative in the scalar quantity. */
    slope: number;

    /** The nonnegative energy curvature in the scalar quantity. */
    curvature: number;
  }

  /**
   * Weight a unit barrier to balance the starting deformation gradient.
   *
   * @param size The coordinate dimension.
   * @param rows Sparse energy terms before multiplying their barrier rows.
   * @param first The first barrier term in those rows.
   * @returns The scalar minimising the combined gradient norm.
   * @evidence contracts/development/common.md#meaningful-documentation Defines row order and the scalar result.
   * @evidence contracts/development/implementation.md#principled-implementation Li et al. 2020 technical supplement §6's least-squares balance, projecting the unit barrier gradient onto the negative deformation gradient.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Accumulate two gradients and take their scalar projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual row contributes its computed gradient; the caller applies the physical conditioning interval.
   * @evidence contracts/development/implementation.md#efficient-algorithms One sparse row pass and two coordinate inner products, once per deformation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same local energy and barrier rows as the deformation step.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Both gradient arrays are released on return.
   */
  export function balance(size: number, rows: readonly IRow[], first: number): number {
    const elastic: Float64Array = new Float64Array(size);
    const barrier: Float64Array = new Float64Array(size);
    for (let i: number = 0; i < rows.length; i++) {
      const row: IRow = rows[i]!;
      const to: Float64Array = i < first ? elastic : barrier;
      for (let j: number = 0; j < row.index.length; j++)
        to[row.index[j]!]! += row.slope * row.coef[j]!;
    }
    const squared: number = dot(barrier, barrier);
    return squared === 0 ? 0 : -dot(barrier, elastic) / squared;
  }

  /**
   * Solve the linear Newton equation with diagonal preconditioning, keeping
   * only the row-local nonzero entries of the projected Hessian.
   *
   * @param size The Cartesian dimension.
   * @param rows The current iterate's local scalar terms.
   * @param background The diagonal scale of the undamped deformation, before contact stiffness.
   * @returns The Newton step, in metres.
   * @evidence contracts/development/common.md#meaningful-documentation States the current sparse inputs, solve and output units.
   * @evidence contracts/development/implementation.md#principled-implementation Accumulates exact rank-one Hessian products and gradient terms. A square-root machine epsilon relative floor regularizes the translation null space. Standard diagonally preconditioned conjugate gradients stop at the corresponding relative residual or at the Cartesian dimension.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One gradient/diagonal assembly and one matrix-free linear solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Regularization is a rounding scale, and the nonlinear acceptance remains the caller's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each iteration is linear in the nonzero entries of the terms plus the Cartesian dimension.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The diagonal and row values are fixed at that iterate and serve every matrix-vector product.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Uses five size-bounded vectors and retains only the returned step.
   */
  export function of(size: number, rows: readonly IRow[], background: number): Float64Array {
    const residual: Float64Array = new Float64Array(size);
    const diagonal: Float64Array = new Float64Array(size);
    for (const row of rows)
      for (const [i, index] of row.index.entries()) {
        const d: number = row.coef[i]!;
        residual[index]! -= row.slope * d;
        diagonal[index]! += row.curvature * d * d;
      }
    const result: Float64Array = new Float64Array(size);
    const direction: Float64Array = new Float64Array(size);
    const product: Float64Array = new Float64Array(size);
    const accurate: number = Math.sqrt(Number.EPSILON);
    // Only the deformation's translation null space needs a shift. A
    // near-singular element can have an arbitrarily large local curvature
    // without requiring any damping on vertices that do not touch it.
    const shift: number = Math.max(Number.MIN_VALUE, background * accurate);
    for (let i: number = 0; i < size; i++) {
      diagonal[i]! += shift;
      direction[i] = residual[i]! / diagonal[i]!;
    }
    let prior: number = dot(residual, direction);
    const limit: number = Number.EPSILON * prior;
    for (let iteration: number = 0; iteration < size && prior > limit; iteration++) {
      for (let i: number = 0; i < size; i++) product[i] = shift * direction[i]!;
      for (const row of rows) {
        let scalar: number = 0;
        for (let i: number = 0; i < row.index.length; i++) scalar += row.coef[i]! * direction[row.index[i]!]!;
        scalar *= row.curvature;
        for (let i: number = 0; i < row.index.length; i++) product[row.index[i]!]! += scalar * row.coef[i]!;
      }
      const projected: number = dot(direction, product);
      if (!(projected > 0)) break;
      const gain: number = prior / projected;
      let present: number = 0;
      for (let i: number = 0; i < size; i++) {
        result[i]! += gain * direction[i]!;
        residual[i]! -= gain * product[i]!;
        present += residual[i]! ** 2 / diagonal[i]!;
      }
      const beta: number = present / prior;
      for (let i: number = 0; i < size; i++) direction[i] = residual[i]! / diagonal[i]! + beta * direction[i]!;
      prior = present;
    }
    return result;
  }

  /** Cartesian inner product of the iteration's equal-length work vectors. */
  function dot(a: Float64Array, b: Float64Array): number {
    let out: number = 0;
    for (let i: number = 0; i < a.length; i++) out += a[i]! * b[i]!;
    return out;
  }
}
