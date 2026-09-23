import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

const DOWN = Vector3.create(0, -1, 0);

/**
 * Direct tilt into the selected plane, followed by independent rotation about
 * the resulting humeral axis. There is no initial long-axis turn, unlike YXY.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Gives an authored humerothoracic elevation its direction without coupling plane choice into axial rotation.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Rotates about the plane's transverse axis before applying a separate final-axis torsion.
 */
export function humanBodyShoulderTtRotation(
  pose: IAutoMovieHumanBodyShoulderPose,
): IAutoMovieQuaternion {
  const side = pose.bone === "leftUpperArm" ? 1 : -1;
  const plane = pose.plane * Quaternion.DEG2RAD;
  const tiltAxis = Vector3.create(-Math.sin(plane), 0, side * Math.cos(plane));
  const tilt = Quaternion.fromAxisAngle(tiltAxis, pose.elevation);
  const humeralAxis = Quaternion.rotateVector(tilt, DOWN);
  const torsion = Quaternion.fromAxisAngle(
    humeralAxis,
    -side * pose.axialRotation,
  );
  return Quaternion.normalize(Quaternion.multiply(torsion, tilt));
}
