/**
 * One directed triangle edge that the shared boundary subdivides: its two
 * mesh-vertex endpoints and the inserted boundary vertices, ordered from
 * `from` to `to`.
 *
 * @evidence contracts/common.md#principled-implementation Re-triangulating a touched triangle needs each split edge and its ordered inserted vertices.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inserted vertices are the canonical boundary samples already appended; nothing is re-sampled.
 * @evidence contracts/common.md#meaningful-documentation States each field and the insertion order.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A split defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The stitch emits triangles; the split records which vertices they use.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Vertex indices carry no frame or unit.
 * @evidence contracts/modeling.md#shared-boundaries Inserted vertices are the shared boundary samples both sides use.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal bookkeeping that is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived bookkeeping, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonEdgeSplit {
  /** Mesh vertex the directed edge leaves. */
  from: number;

  /** Mesh vertex the directed edge reaches. */
  to: number;

  /** Inserted boundary vertices, ordered from `from` to `to`. */
  added: number[];
}
