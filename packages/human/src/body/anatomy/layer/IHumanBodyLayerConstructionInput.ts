import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanBodyNativeSubcutaneousSource } from "../assembly/IAutoMovieHumanBodyNativeSubcutaneousSource";
import type { IHumanBodyLayerSurfacesInput } from "./IHumanBodyLayerSurfacesInput";

/**
 * Final skin and immutable native source identity for layer construction. The supplied exterior and positions belong to the same final metre frame.
 *
 * @evidence contracts/common.md#principled-implementation Inherited final-frame skin/field inputs meet exact basis/surface/instance identity and optional single native SAT registration.
 * @evidence contracts/common.md#clear-and-simple-design Layer geometry inputs are reused while construction-specific provenance and scalar appearance stay with this boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A native owner refers to the same emitted physical samples rather than duplicate independently supplied SAT geometry.
 * @evidence contracts/common.md#meaningful-documentation Members identify basis/surface/instance, borrowed skin finish and optional native ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction input typing selects no offset or physical-domain generation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Instance/source dependencies declare no memoized layer-construction equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed skin/material/source records acquire no renderer handle or retained build task.
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

  /** Present when this calculation supplies the source assembly's single SAT owner. */
  nativeSource?: IAutoMovieHumanBodyNativeSubcutaneousSource;
}
