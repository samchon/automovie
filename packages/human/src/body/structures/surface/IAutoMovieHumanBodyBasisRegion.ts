/**
 * One material region of the connected body, retaining its oriented triangle and corner-UV partition.
 *
 * @evidence contracts/common.md#principled-implementation Carries region IDs, material IDs, oriented source indices and corner UV arrays, preserving the original material-region partition and mutable array contract.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original material-region partition and mutable array contract; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Region identity, material identity and oriented corner indices stay distinct; null UVs retain untextured geometry instead of inventing a UV layout.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidence contracts/modeling.md#part-identity-and-grouping The named source region groups oriented triangles under one existing material identity; it shares the source vertex order instead of duplicating a regional shape.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source/document channel owners retain the original controls; this carrier adds no channel or coupling.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Corner UV pairs use the source UV0 convention, with V increasing downward; indices address the shared source vertex order and carry no distance unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The original source and numerical owners retain acquisition and anatomical qualification; this record infers no new anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Region indices and corner UVs are offline shared source incidence, not a public anatomical authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisRegion {
  /** Source region identity. */
  id: string;

  /** Existing material identity. */
  material: string;

  /** Oriented triangle corners in the shared source vertex order. */
  indices: number[];

  /** UV pairs per corner, or null for untextured geometry. */
  uvs: number[] | null;
}
