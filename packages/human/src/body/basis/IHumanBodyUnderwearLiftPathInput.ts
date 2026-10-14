/**
 * Actual represented base and returned normals for one local lift polynomial.
 *
 * Internal callers supply exactly three finite XYZ triples and matching finite unit normals, a zero-through-two corner and a finite signed offset. The factory validates the fixed material; its actual evaluation supplies the face.
 *
 * @evidence contracts/common.md#principled-implementation Three represented base vertices, matching returned unit normals and one corner define orientation along the full finite signed offset interval.
 * @evidence contracts/common.md#clear-and-simple-design The local face carrier separates actual evaluation operands from fixed material admission owned by the factory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The number-array type alone cannot guarantee finite triples/unit normals; admitted internal callers must preserve those premises and original face order.
 * @evidence contracts/common.md#meaningful-documentation Members define three-corner correspondence, zero-through-two selection and signed-meter endpoint meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lift-path input typing computes no quadratic orientation polynomial.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Face operands describe one actual path evaluation without caching another candidate's polynomial.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed face triples and normals acquire no exact-fraction workspace or lifted output.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftPathInput {
  /** Three base vertices, in posed skin metres and original face order. */
  points: readonly (readonly number[])[];

  /** Three actual returned unit vertex normals in matching face order. */
  normals: readonly (readonly number[])[];

  /** Corner normal against which orientation is measured, zero through two. */
  corner: number;

  /** Complete existing signed offset interval endpoint in metres. */
  offsetMetres: number;
}
