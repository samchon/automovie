/**
 * Actual represented base and returned normals for one local lift polynomial.
 *
 * Internal callers supply exactly three finite XYZ triples and matching finite
 * unit normals, a zero-through-two corner and a finite signed offset. The
 * factory validates the fixed material; its actual evaluation supplies the face.
 *
 * @evidence contracts/common.md#principled-implementation Three matching base and unit-normal triples, one corner and the complete signed offset define the actual affine-normal lift polynomial.
 * @evidence contracts/common.md#clear-and-simple-design Both forward acceptance and analytic proposals pass the same face and returned normals to one exact path owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies the actual signed interval and represented normal values; this input offers no surrogate plane or shortened offset.
 * @evidence contracts/common.md#meaningful-documentation Documents the validated caller preconditions, corner population and actual represented-coordinate ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidence contracts/modeling.md#spatial-conventions Base vertices and signed offset use posed-skin metres; the matching unit normals are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
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
