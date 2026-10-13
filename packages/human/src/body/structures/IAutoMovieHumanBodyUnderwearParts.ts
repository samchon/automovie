import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "./IHumanBodyUnderwearRegion";

/**
 * Prepared material, normal lift and source coverage for underwear parts.
 * Final Body and Person consumers cut their actual performed region meshes
 * and lift fabric there, after placement and shared-skin assembly.
 * The same unsplit skin remains authoritative for anatomy and contact.
 *
 * @evidence contracts/common.md#principled-implementation Source-aligned rest coverage and corner correspondence let final consumers cut performed skin and lift fabric along its normals.
 * @evidence contracts/common.md#clear-and-simple-design Material and lift travel beside one rest field and a map of actual region correspondences.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unsplit skin remains anatomy and contact authority instead of substituting fabric geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state metre lift, native vertex order and source-to-renderer correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The prepared garment composition record declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The prepared garment composition record declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The prepared garment composition record type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearParts {
  /** Costume material, independent of skin colour multipliers. */
  material: IAutoMovieMaterial;

  /** Signed fabric displacement along final unit skin normals, metres. */
  offsetMetres: number;

  /** Finite rest coverage per native vertex, in basis surface order. */
  sourceFields: readonly (readonly number[])[];

  /** Actual region ids and original source-to-renderer correspondence. */
  regions: ReadonlyMap<string, IHumanBodyUnderwearRegion>;
}
