import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Shared by IPortraitEyeSphere, fitPortraitEyeSphere, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates the fitted globe centre and curvature radius from gaze or visible aperture size.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines the common millimetre spherical support used by eyelid contact, sclera and iris placement.
 * @author Samchon
 */
export const mean = (points: IAutoMovieVector3[]): IAutoMovieVector3 =>
  Vector3.scale(
    points.reduce(Vector3.add, Vector3.create()),
    1 / points.length,
  );
