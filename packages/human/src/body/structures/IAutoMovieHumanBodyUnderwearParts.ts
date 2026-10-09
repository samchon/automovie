import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "./IHumanBodyUnderwearRegion";

/**
 * Prepared material and source coverage for skin-attached underwear parts.
 * The final Body or Person consumer partitions its actual performed region
 * meshes. No independent garment positions, offset or fitted surface is stored.
 * The same unsplit skin remains authoritative for anatomy and contact.
 *
 * @evidence contracts/common.md#principled-implementation Rest coverage and original corner correspondence remain separate from final performed meshes.
 * @evidence contracts/common.md#clear-and-simple-design Material, native fields and region correspondence form one complete prepared recipe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal garment coordinates or solver success state are carried.
 * @evidence contracts/common.md#meaningful-documentation States zero-thickness meaning and final consumer ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Final composition names parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document owns garment controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries no meshes.
 * @evidence contracts/modeling.md#spatial-conventions Source fields use signed rest-frame coverage values in metres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The partition owner computes the contour.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final consumers observe the output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries source fields without defining anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Coverage and document owners admit values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input control.
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
