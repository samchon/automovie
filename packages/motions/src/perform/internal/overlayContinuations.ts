import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { orderHumanLimbs } from "../../posture/internal/orderHumanLimbs";
import { HumanSegmentPose } from "../HumanSegmentPose";

/**
 * The matching nearby fits for an overlay leaf tag, or the final contacts
 * without one, keyed by limb in resolution order; none without a nearby
 * record.
 *
 * Moved unchanged from `HumanSegmentOverlay` to keep that file under the
 * repository's 500-line limit; its caller and behaviour are unchanged.
 */
export function overlayContinuations(
  limbs: IAutoMovieMotionHumanPosture["limbs"],
  near: HumanSegmentPose.INear | undefined,
  tag?: string,
): IAutoMovieMotionHumanResolveHumanPosture.INear | undefined {
  const ordered: AutoMovieHumanLimb[] = orderHumanLimbs(limbs);
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
