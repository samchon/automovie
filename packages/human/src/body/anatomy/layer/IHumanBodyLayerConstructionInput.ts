import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IHumanBodyLayerSurfacesInput } from "./IHumanBodyLayerSurfacesInput";

/**
 * Final skin and immutable native source identity for layer construction.
 * The supplied exterior and positions belong to the same final metre frame.
 *
 * @evidence contracts/common.md#principled-implementation Extends the existing offset input with actual surface and instance identity.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the one field and exterior contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No extra geometry or clinical values replace the supplied source.
 * @evidence contracts/common.md#meaningful-documentation States final frame and immutable source responsibility.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The construction owner defines parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source data is not personal authoring.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Inherits final metre positions and dimensionless native addresses.
 * @evidence contracts/modeling.md#shared-boundaries The inherited exterior carries actual origin incidence.
 * @evidenceExclude contracts/modeling.md#rendered-observation This input is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The field owns its values and their qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing surface owner measures offset conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No personal document addresses these vertices.
 * @author Samchon
 */
export interface IHumanBodyLayerConstructionInput extends IHumanBodyLayerSurfacesInput {
  /** Exact native body basis revision addressed by the field. */
  basis: string;

  /** Native skin surface identity, used to distinguish independently addressed fields. */
  surface: string;

  /** Actual evaluated document instance owning these emitted physical samples. */
  instance: string;

  /** Existing resident skin finish supplying scalar inspection appearance. */
  material: IAutoMovieMaterial;
}
