/**
 * One cell of a source triangle tree: its parent-triangle ordinal and its
 * oriented canonical sample IDs, read against the parent's ordered corners.
 *
 * @evidence contracts/common.md#principled-implementation A cell of a partitioned parent triangle is exactly its parent and its oriented samples.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cells come from the compiled partition or normal subdivision; nothing is synthesized here.
 * @evidence contracts/common.md#meaningful-documentation States both fields and what the samples are read against.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A cell defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A cell names existing source lineage and emits nothing.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Ordinals and IDs carry no frame or unit.
 * @evidence contracts/modeling.md#shared-boundaries Geometric partitions of both skins and their shared normal subdivision are proven through this one cell shape.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCell {
  /** Ordinal of the parent triangle in the source tree. */
  parent: number;

  /** Oriented canonical sample IDs of the cell's corners. */
  samples: readonly number[];
}
