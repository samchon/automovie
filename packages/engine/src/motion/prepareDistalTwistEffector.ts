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
 * Own the lazy target-independent effector readings of one distal-twist
 * operation, under unchanged fixed rest rotation, admitted basis and clinical
 * frame. No numerical admission runs until the original first-use reader.
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
  let abduction: IAutoMovieVector3 | undefined;
  let flexion: IAutoMovieVector3 | undefined;
  let zero: solveDistalTwist.IZero | undefined;
  return {
    abduction: (): IAutoMovieVector3 => {
      abduction ??= Quaternion.rotateVector(rest, basis.abduction);
      return abduction;
    },
    flexion: (): IAutoMovieVector3 => {
      flexion ??= Quaternion.rotateVector(rest, basis.flexion);
      return flexion;
    },
    zero: (): solveDistalTwist.IZero => {
      if (zero === undefined) {
        const handed: number =
          Vector3.dot(
            basis.twist,
            Vector3.cross(basis.flexion, basis.abduction),
          ) >= 0
            ? 1
            : -1;
        const phi: number =
          (handed * (toRigAngle(0, frame?.twist) ?? 0) * Math.PI) / 180;
        zero = { cosine: Math.cos(phi), sine: Math.sin(phi) };
      }
      return zero;
    },
  };
}
