import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "./IHumanBodyUnderwearRegion";

/**
 * Prepared material, normal lift and source coverage for underwear parts.
 * Final Body and Person consumers cut their actual performed region meshes
 * and lift fabric there, after placement and shared-skin assembly.
 * The same unsplit skin remains authoritative for anatomy and contact.
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
