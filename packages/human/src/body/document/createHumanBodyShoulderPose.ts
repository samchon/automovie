import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

/**
 * One thorax-relative humeral goal of a body document.
 *
 * `plane` is the elevation plane (0 lateral, +90 anterior), `elevation` the
 * total elevation and `axialRotation` the axial rotation, all in degrees; the
 * builder resolves the goal into clavicle, scapula and humerus. Editor presets
 * and review states build their shoulder goals through this one owner;
 * admission and the shoulder resolver still judge the goal.
 *
 * @author Samchon
 */
export function createHumanBodyShoulderPose(
  bone: IAutoMovieHumanBodyShoulderPose["bone"],
  plane: number,
  elevation: number,
  axialRotation = 0,
): IAutoMovieHumanBodyShoulderPose {
  return { bone, plane, elevation, axialRotation };
}
