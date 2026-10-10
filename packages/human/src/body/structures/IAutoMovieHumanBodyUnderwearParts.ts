import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "./IHumanBodyUnderwearRegion";

/**
 * Prepared material and source coverage for skin-attached underwear parts.
 * The final Body or Person consumer partitions its actual performed region
 * meshes. No independent garment positions, offset or fitted surface is stored.
 * The same unsplit skin remains authoritative for anatomy and contact.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearParts {
  /** Costume material, independent of skin colour multipliers. */
  material: IAutoMovieMaterial;

  /** Finite rest coverage per native vertex, in basis surface order. */
  sourceFields: readonly (readonly number[])[];

  /** Actual region ids and original source-to-renderer correspondence. */
  regions: ReadonlyMap<string, IHumanBodyUnderwearRegion>;
}
