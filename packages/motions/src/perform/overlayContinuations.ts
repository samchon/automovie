import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSegmentPose } from "./HumanSegmentPose";

/**
 * The matching nearby fits for an overlay leaf tag, or the final contacts without one, keyed by limb in resolution order; none without a nearby record.
 *
 * Moved unchanged from `HumanSegmentOverlay` to keep that file under the
 * repository's 500-line limit; its caller and behaviour are unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the function computes and where it was moved from; the caller's documentation states the method.
 * @evidence contracts/development/implementation.md#principled-implementation The same computation its caller performed inline before the move, with the same inputs and outputs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function per file; the caller keeps its own decisions and delegates this step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No value, tolerance or branch changed in the move.
 * @evidence contracts/development/implementation.md#efficient-algorithms The cost is the moved body's, unchanged; the move adds one call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares nothing beyond what the body shared before the move.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond what the body retained before the move.
 */
export function overlayContinuations(
  limbs: IAutoMovieMotionHumanPosture["limbs"],
  near: HumanSegmentPose.INear | undefined,
  tag?: string,
): IAutoMovieMotionHumanResolveHumanPosture.INear | undefined {
  const ordered: AutoMovieHumanLimb[] = resolveHumanPosture.order(limbs);
  if (near === undefined) return undefined;
  const prefix: string = tag === undefined ? "contact" : `leaf:${tag}`;
  return Object.fromEntries(
    ordered.flatMap(
      (
        limb: AutoMovieHumanLimb,
      ): [AutoMovieHumanLimb, IAutoMovieSwivelNear][] => {
        const continued: IAutoMovieSwivelNear | undefined =
          HumanSegmentPose.nearby(near, `${prefix}:${limb}`);
        return continued === undefined ? [] : [[limb, continued]];
      },
    ),
  );
}
