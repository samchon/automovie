/*
 * Solve the linear Newton equation with diagonal preconditioning, keeping only
 * the row-local nonzero entries of the projected Hessian.
 * Parameter size: The Cartesian dimension.
 * Parameter rows: The current iterate's local scalar terms.
 * Parameter background: The diagonal scale of the undamped deformation, before
 * contact stiffness.
 * Returns: The Newton step, in metres.
 */
export function HumanInteractionMeshStep(
  size: number,
  rows: readonly HumanInteractionMeshStep.IRow[],
  background: number,
): Float64Array {
  const residual: Float64Array = new Float64Array(size);
  const diagonal: Float64Array = new Float64Array(size);
  // Pack this iterate's row derivatives in the order of both Jacobian
  // products. Every conjugate direction uses the same sparse structure.
  const offsets: Uint32Array = new Uint32Array(rows.length + 1);
  for (let r: number = 0; r < rows.length; r++)
    offsets[r + 1] = offsets[r]! + rows[r]!.index.length;
  const columns: Uint32Array = new Uint32Array(offsets[rows.length]!);
  const derivatives: Float64Array = new Float64Array(columns.length);
  const curvatures: Float64Array = new Float64Array(rows.length);
  for (let r: number = 0; r < rows.length; r++) {
    const row: HumanInteractionMeshStep.IRow = rows[r]!;
    curvatures[r] = row.curvature;
    for (let i: number = 0; i < row.index.length; i++) {
      const column: number = row.index[i]!;
      const derivative: number = row.coef[i]!;
      const entry: number = offsets[r]! + i;
      columns[entry] = column;
      derivatives[entry] = derivative;
      residual[column]! -= row.slope * derivative;
      diagonal[column]! += row.curvature * derivative * derivative;
    }
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
  for (
    let iteration: number = 0;
    iteration < size && prior > limit;
    iteration++
  ) {
    for (let i: number = 0; i < size; i++) product[i] = shift * direction[i]!;
    for (let r: number = 0; r < rows.length; r++) {
      const begin: number = offsets[r]!;
      const end: number = offsets[r + 1]!;
      let scalar: number = 0;
      for (let i: number = begin; i < end; i++)
        scalar += derivatives[i]! * direction[columns[i]!]!;
      scalar *= curvatures[r]!;
      for (let i: number = begin; i < end; i++)
        product[columns[i]!]! += scalar * derivatives[i]!;
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
    for (let i: number = 0; i < size; i++)
      direction[i] = residual[i]! / diagonal[i]! + beta * direction[i]!;
    prior = present;
  }
  return result;
}

/*
 * Matrix-free projected Gauss–Newton step for interaction-mesh deformation.
 *
 * Li et al. 2020 §4.3's positive curvature term is a sum of local outer
 * products. Using the Laplacian and constraint Jacobians in the same form
 * supports a diagonally conditioned conjugate-gradient solve without filling an
 * all-point quadratic program.
 */
export namespace HumanInteractionMeshStep {
  /*
   * A scalar objective's contribution along one sparse derivative.
   */
  export interface IRow {
    /*
     * The indices of the included Cartesian components.
     */
    index: readonly number[];

    /*
     * The scalar quantity's first derivative in each component.
     */
    coef: readonly number[];

    /*
     * The energy derivative in the scalar quantity.
     */
    slope: number;

    /*
     * The nonnegative energy curvature in the scalar quantity.
     */
    curvature: number;
  }

  /*
   * Weight a unit barrier to balance the starting deformation gradient.
   * Parameter size: The coordinate dimension.
   * Parameter rows: Sparse energy terms before multiplying their barrier rows.
   * Parameter first: The first barrier term in those rows.
   * Returns: The scalar minimising the combined gradient norm.
   */
  export function balance(
    size: number,
    rows: readonly IRow[],
    first: number,
  ): number {
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
}

/*
 * Cartesian inner product of the iteration's equal-length work vectors.
 */
function dot(a: Float64Array, b: Float64Array): number {
  let out: number = 0;
  for (let i: number = 0; i < a.length; i++) out += a[i]! * b[i]!;
  return out;
}
