/**
 * One material region in an exact partition of a face surface's triangles.
 *
 * The regions of a surface preserve its oriented triples, so connectivity and
 * normals stay owned by the surface across material and UV seams.
 *
 * @evidence contracts/common.md#principled-implementation Regions partition the surface's triangles exactly, so material splitting never changes shared connectivity or normals.
 * @evidence contracts/common.md#clear-and-simple-design One named record holds a region's ID, material, triangles and corner UVs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Regions are shared basis data, never a personal selection.
 * @evidence contracts/common.md#meaningful-documentation States the partition, the orientation rule and the UV layout.
 * @evidence contracts/modeling.md#part-identity-and-grouping A region groups one surface's triangles under one material.
 * @evidence contracts/modeling.md#spatial-conventions Indices are dimensionless vertex IDs of the surface; UVs are dimensionless texture coordinates per corner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The region is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The region gatherer emits geometry; the region selects existing triangles.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Regions of one surface share its vertices; they build no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder observes the emitted regions.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A material partition is not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The region bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisRegion {
  /** Region identity, unique within its surface. */
  id: string;

  /** ID of the resident material this region renders with. */
  material: string;

  /** Oriented triangle corners, each a vertex index of the surface. */
  indices: number[];

  /** Flat UV pairs per triangle corner, or null for untextured geometry. */
  uvs: number[] | null;
}
