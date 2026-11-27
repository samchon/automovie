import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Construct an owned numeric rigid turn from the solved flight's output: fresh
 * records of its centre and its quaternion.
 * Parameter about: The point the posture turns about, world metres.
 * Parameter turn: The turn.
 * Returns: The rotation, owning its records.
 */
export function createHumanPostureRotation(
  about: IAutoMovieVector3,
  turn: IAutoMovieQuaternion,
): IAutoMovieHumanPostureRotation {
  return {
    about: { x: about.x, y: about.y, z: about.z },
    turn: { x: turn.x, y: turn.y, z: turn.z, w: turn.w },
  };
}