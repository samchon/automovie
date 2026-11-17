import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import type { kneelKeys } from "./kneelKeys";

/**
 * Prepare one foot's course between fixed kneeling keys. A stationary toe
 * joint remains the pivot while pitch changes; a moving one follows the
 * existing foot arc between its two prepared rigid placements.
 *
 * @param body The fixed body of this plan.
 * @param side The foot.
 * @param from Its entry key, immutable during the course.
 * @param to Its exit key, immutable during the course.
 * @param clearance The moving foot's vertical clearance in metres.
 * @returns The placement, bearing state and toe flexion in degrees at a progress share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed endpoints, stationary pivot, moving arc, metres and returned degree value.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the existing 0.1 mm movement classification, same toe interpolation, rigid toe pivot and canonical foot arc at the caller's eased progress.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Classifies once, then binds either the original stationary pivot or the moving endpoints' native arc; the result writer keeps the unchanged planted/toe fields.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The movement threshold and planted endpoint rules remain unchanged and no contact or range bound is relaxed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Stationary phases prepare fixed heading/socket geometry once; moving phases prepare both actual pivots plus native fixed-endpoint vector/slerp prerequisites once. Each query retains its original current pitch or arc and fresh placement, without rebuilding those constants.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body and the two authored keys remain fixed, so only progress and interpolated toe flexion vary; no posture fit or evaluated output is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains two keys and, for a moving foot, two rigid placements until its owning kneel plan is released.
 */
export function prepareKneelFoot(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  from: kneelKeys.IFoot,
  to: kneelKeys.IFoot,
  clearance: number,
): (share: number) => {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  planted: boolean;
  toes: number;
} {
  const moves: boolean =
    Vector3.length(Vector3.subtract(from.at, to.at)) > 1e-4;
  const place: (share: number) => IAutoMovieMotionHumanFoot.IPlacement = ((): ((
    share: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement) => {
    if (!moves) {
      const pivot: ReturnType<typeof HumanFoot.preparePivot> =
        HumanFoot.preparePivot(body, side, "mtp", from.at, from.heading);
      return (share: number): IAutoMovieMotionHumanFoot.IPlacement =>
        pivot(from.pitch + (to.pitch - from.pitch) * share);
    }
    const start: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      side,
      "mtp",
      from.at,
      from.heading,
      from.pitch,
    );
    const end: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      side,
      "mtp",
      to.at,
      to.heading,
      to.pitch,
    );
    return AutoMovieMotionHumanLeg.prepareArc(start, end, clearance);
  })();
  return (
    share: number,
  ): { placement: IAutoMovieMotionHumanFoot.IPlacement; planted: boolean; toes: number } => ({
    placement: place(share),
    planted: !moves || share <= 0 || share >= 1,
    toes: from.toes + (to.toes - from.toes) * share,
  });
}
