import type { IAutoMovieMaterial } from "@automovie/interface";
import type { IAutoMovieHumanBodyNativeSubcutaneousSource } from "../assembly/IAutoMovieHumanBodyNativeSubcutaneousSource";

import type { IHumanBodyLayerSurfacesInput } from "./IHumanBodyLayerSurfacesInput";

/**
 * Final skin and immutable native source identity for layer construction.
 * The supplied exterior and positions belong to the same final metre frame.
 *
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
