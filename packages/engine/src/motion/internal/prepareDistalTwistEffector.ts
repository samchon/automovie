import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEngineRigAngle } from "../../rom/internal/AutoMovieEngineRigAngle";
import type { AutoMovieEngineMotionDistalTwist } from "../AutoMovieEngineMotionDistalTwist";

/*
 * Own the target-independent effector readings of one distal-twist operation,
 * under unchanged fixed rest rotation, admitted basis and clinical frame.
 */
export function prepareDistalTwistEffector(
  props: Pick<
    Parameters<typeof AutoMovieEngineMotionDistalTwist.solve>[0],
    "effectorRest" | "effectorBasis" | "effectorFrame"
  >,
): AutoMovieEngineMotionDistalTwist.IPrepared {
  const rest: IAutoMovieQuaternion = props.effectorRest;
  const basis: IAutoMovieJointAxes = props.effectorBasis;
  const frame: IAutoMovieRestFrame | undefined = props.effectorFrame;
  const abduction: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    rest,
    basis.abduction,
  );
  const flexion: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    rest,
    basis.flexion,
  );
  const handed: number =
    AutoMovieEngineVector3.dot(basis.twist, AutoMovieEngineVector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const phi: number =
    (handed * (AutoMovieEngineRigAngle.toRigAngle(0, frame?.twist) ?? 0) * Math.PI) / 180;
  const zero: AutoMovieEngineMotionDistalTwist.IZero = {
    cosine: Math.cos(phi),
    sine: Math.sin(phi),
  };
  return {
    abduction: (): IAutoMovieVector3 => abduction,
    flexion: (): IAutoMovieVector3 => flexion,
    zero: (): AutoMovieEngineMotionDistalTwist.IZero => zero,
  };
}
