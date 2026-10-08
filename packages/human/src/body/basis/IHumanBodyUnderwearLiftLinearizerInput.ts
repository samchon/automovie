/**
 * Fixed material basis for analytic derivatives of the actual normal lift.
 *
 * @evidence contracts/common.md#principled-implementation Original coordinates, supplied directions, triangle incidence and source correspondence remain one fixed material basis; candidate coordinates enter separately through the actual evaluation.
 * @evidence contracts/common.md#clear-and-simple-design The fixed basis is one input boundary shared by the normal and lift derivative owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains the supplied signed offset and correspondence without exposing a replacement normal, vertex selector or fitted seed.
 * @evidence contracts/common.md#meaningful-documentation Each field identifies its source ownership, material order or posed-skin metre unit.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidence contracts/modeling.md#spatial-conventions Original coordinates and signed offset use the posed skin frame in metres; sourceVertices maps component-local indices back to the original cut.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
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
