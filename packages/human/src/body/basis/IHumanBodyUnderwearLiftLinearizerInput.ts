/**
 * Fixed material basis for analytic derivatives of the actual normal lift.
 *
 * @evidence contracts/common.md#principled-implementation Immutable cut points, supplied directions, indexed triangles and source-vertex mapping preserve the material basis for actual lift differentiation over a signed meter offset.
 * @evidence contracts/common.md#clear-and-simple-design One fixed-input carrier separates original material correspondence from changing fitted candidate coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Analytic lift rows cannot remove material faces, mutate source samples or replace failed directions with frozen normals.
 * @evidence contracts/common.md#meaningful-documentation Members give posed meter units, zero identity, matching vertex order and original source correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Linearizer-input typing performs no normal transport or sparse analytic differentiation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fixed material metadata describes reusable operands without implementing derivative-cache validity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed lift inputs acquire no sparse derivative maps or numerical program lifetime.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftLinearizerInput {
  /** Original cut coordinates in posed skin metres; never mutated. */
  points: readonly number[];

  /** Original supplied source directions in matching vertex order. */
  normals: readonly number[];

  /** Original indexed material triangles; no face is removed. */
  indices: readonly number[];

  /** Existing signed lift in metres, including zero identity. */
  offsetMetres: number;

  /** Original cut vertex for each connected component-local vertex. */
  sourceVertices: readonly number[];
}
