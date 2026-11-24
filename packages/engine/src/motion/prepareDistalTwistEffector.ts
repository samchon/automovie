import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { toRigAngle } from "../rom/toRigAngle";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * Own the target-independent effector readings of one distal-twist operation,
 * under unchanged fixed rest rotation, admitted basis and clinical frame.
 */
export function prepareDistalTwistEffector(
  props: Pick<
    Parameters<typeof solveDistalTwist>[0],
    "effectorRest" | "effectorBasis" | "effectorFrame"
  >,
): solveDistalTwist.IPrepared {
  const rest: IAutoMovieQuaternion = props.effectorRest;
  const basis: IAutoMovieJointAxes = props.effectorBasis;
  const frame: IAutoMovieRestFrame | undefined = props.effectorFrame;
  const abduction: IAutoMovieVector3 = Quaternion.rotateVector(
    rest,
    basis.abduction,
  );
  const flexion: IAutoMovieVector3 = Quaternion.rotateVector(
    rest,
    basis.flexion,
  );
  const handed: number =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const phi: number =
    (handed * (toRigAngle(0, frame?.twist) ?? 0) * Math.PI) / 180;
  const zero: solveDistalTwist.IZero = {
    cosine: Math.cos(phi),
    sine: Math.sin(phi),
  };
  return {
    abduction: (): IAutoMovieVector3 => abduction,
    flexion: (): IAutoMovieVector3 => flexion,
    zero: (): solveDistalTwist.IZero => zero,
  };
}
