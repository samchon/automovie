import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";
import type { solveDistalTwist } from "./solveDistalTwist";

/**
 * Own the lazy target-independent effector readings of one distal-twist
 * operation, under unchanged fixed rest rotation, admitted basis and clinical
 * frame. No numerical admission runs until the original first-use reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed inputs, lazy admission and borrowed reader results for one caller-owned operation.
 * @evidence contracts/development/implementation.md#principled-implementation Rotated flexion/abduction axes and clinical-zero handed twist sine/cosine depend only on the supplied fixed rest/basis/frame, independently of target and lower candidate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure solveDistalTwist.prepare delegates these fixed readers here so its bounded candidate law and paired result remain in one source below the file limit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original rotation, handedness and toRigAngle/trigonometric expressions retain their first-use order, without cached targets, repaired axes or changed clinical zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant setup and at most two vector rotations plus one handed-zero calculation per operation serve every actual distal candidate; no speedup is measured here.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The operation's unchanged rest/basis/frame establish source equivalence; each target still owns its harmonics, range candidates and projected score.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Three closures own at most two derived vectors and one zero record plus borrowed fixed inputs until caller release, with no growing history, handles or tasks.
 */
export function prepareDistalTwistEffector(
  props: Pick<Parameters<typeof solveDistalTwist>[0], "effectorRest" | "effectorBasis" | "effectorFrame">,
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
          Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0 ? 1 : -1;
        const phi: number =
          (handed * (toRigAngle(0, frame?.twist) ?? 0) * Math.PI) / 180;
        zero = { cosine: Math.cos(phi), sine: Math.sin(phi) };
      }
      return zero;
    },
  };
}
