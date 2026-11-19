import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendPreparation } from "../compose/AutoMovieMotionHumanBendPreparation";
import type { AutoMovieMotionHumanBendRepeat } from "../compose/AutoMovieMotionHumanBendRepeat";

/** Existing surface-offset emitter retained only by the prepared hand owner. */
type ITargetEmitter = ReturnType<
  typeof AutoMovieMotionHumanArmTarget.prepareTarget
>;

/**
 * Assemble a full hand target with its original default or authored elbow.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the current wrist, contact, bend and unchanged finger curl.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the original default elbow search or authored preset after original orientation and target preparation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One bend read and one fresh result assembly for both cold and prepared hands.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact, actual writer or explicit authored bend is replaced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Only the selected bend branch runs, and the optional owner-issued loan reaches only numeric scoring.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the existing moving and ordinary target assembly.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned target is fresh and no result is retained.
 */
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
  trial?: readonly [AutoMovieMotionHumanBendRepeat.IRead, 0 | 1],
): IAutoMovieMotionHumanArmTarget.ITarget {
  const bend: IAutoMovieVector3 =
    options.bend === undefined && options.out === undefined
      ? AutoMovieMotionHumanBendPreparation.defaultBend(
          {
            body,
            posture,
            side,
            point: wrist(),
            rotation,
            fallback: "hang",
          },
          trial,
        )
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
