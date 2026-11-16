import { Vector3 } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Classifies once and prepares the two moving endpoints; each query chooses the original pivot or arc expression.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The movement threshold and planted endpoint rules remain unchanged and no contact or range bound is relaxed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed pair classification and moving endpoint pivots are paid once per phase/side; each query performs only its changing pivot or existing arc.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body and the two authored keys remain fixed, so only progress and interpolated toe flexion vary; no posture fit or evaluated output is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains two keys and, for a moving foot, two rigid placements until its owning kneel plan is released.
 */
export function prepareKneelFoot(
  body: IHumanBody,
  side: "left" | "right",
  from: kneelKeys.IFoot,
  to: kneelKeys.IFoot,
  clearance: number,
): (share: number) => { placement: HumanFoot.IPlacement; planted: boolean; toes: number } {
  const moves: boolean = Vector3.length(Vector3.subtract(from.at, to.at)) > 1e-4;
  const pivot: (foot: kneelKeys.IFoot) => HumanFoot.IPlacement = (foot: kneelKeys.IFoot): HumanFoot.IPlacement => HumanFoot.pivot(body, side, "mtp", foot.at, foot.heading, foot.pitch);
  const endpoints: readonly [HumanFoot.IPlacement, HumanFoot.IPlacement] | undefined = moves ? [pivot(from), pivot(to)] : undefined;
  return (share: number): { placement: HumanFoot.IPlacement; planted: boolean; toes: number } => ({
    placement: endpoints === undefined
      ? pivot({ ...from, pitch: from.pitch + (to.pitch - from.pitch) * share })
      : AutoMovieMotionHumanLeg.arc(endpoints[0], endpoints[1], clearance, share),
    planted: !moves || share <= 0 || share >= 1,
    toes: from.toes + (to.toes - from.toes) * share,
  });
}
