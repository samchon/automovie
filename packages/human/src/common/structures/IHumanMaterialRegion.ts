/**
 * The part of a material region that region splitting reads: the triangles
 * of one material as corner references into a connected surface's shared
 * vertices, and the UV pair of each corner.
 *
 * A face basis region and a body basis region both have these two fields (and
 * more, a material id among them), so either passes where this is asked for.
 * Splitting a shared surface into per-material buffers needs only the corner
 * indices and their UVs, and asking for nothing more is what keeps `common`
 * from depending on either anatomy's basis type.
 *
 * @author Samchon
 */
export interface IHumanMaterialRegion {
  /** Oriented triangle corners, each a vertex index of the connected surface. */
  indices: readonly number[];

  /** Flat UV pairs per corner, or null for an untextured region. */
  uvs: readonly number[] | null;
}
