import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The visible eye's spherical curvature basis, in construction millimetres.
 * A fitted surface radius is a portrait control, not a measured globe diameter.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates the fitted globe centre and curvature radius from gaze or visible aperture size.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines the common millimetre spherical support used by eyelid contact, sclera and iris placement.
 */
export interface IPortraitEyeSphere {
  /** Sphere centre behind the fitted lid opening. */
  center: IAutoMovieVector3;
  /** Positive spherical surface radius in millimetres. */
  radius: number;
}
