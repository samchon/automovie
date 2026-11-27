import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendPreparation } from "../../compose/internal/AutoMovieMotionHumanBendPreparation";

/** Existing surface-offset emitter retained only by the prepared hand owner. */
type ITargetEmitter = ReturnType<
  typeof AutoMovieMotionHumanArmTarget.prepareTarget
>;

/** Assemble a full hand target with its original default or authored elbow. */
export function assembleHumanHandTarget(
  body: IAutoMovieMotionHumanBody,
  posture: Parameters<typeof AutoMovieMotionHumanBend.arm>[1],
  side: AutoMovieHumanSide,
  point: IAutoMovieVector3,
  options: IAutoMovieMotionHumanTarget.IHand,
  surface: IAutoMovieMotionHumanHand.Surface,
  shape: IAutoMovieMotionHumanHand.Shape,
  rotation: IAutoMovieQuaternion,
  wrist: () => IAutoMovieVector3,
  emit?: ITargetEmitter,
): IAutoMovieMotionHumanArmTarget.ITarget {
  const bend: IAutoMovieVector3 =
    options.bend === undefined && options.out === undefined
      ? AutoMovieMotionHumanBendPreparation.defaultBend({
          body,
          posture,
          side,
          point: wrist(),
          rotation,
          fallback: "hang",
        })
      : AutoMovieMotionHumanBend.arm(
          body,
          posture,
          side,
          options.bend,
          options.out ?? 0,
        );
  if (emit !== undefined)
    return emit({
      point,
      rotation,
      bend,
      ...(options.curl === undefined ? {} : { curl: options.curl }),
    });
  return {
    surface,
    shape,
    point,
    rotation,
    bend,
    ...(options.curl === undefined ? {} : { curl: options.curl }),
  };
}
