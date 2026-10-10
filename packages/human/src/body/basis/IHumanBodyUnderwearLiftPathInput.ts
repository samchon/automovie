/**
 * Actual represented base and returned normals for one local lift polynomial.
 *
 * Internal callers supply exactly three finite XYZ triples and matching finite
 * unit normals, a zero-through-two corner and a finite signed offset. The
 * factory validates the fixed material; its actual evaluation supplies the face.
 *
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
