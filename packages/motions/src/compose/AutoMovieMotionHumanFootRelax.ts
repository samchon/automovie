import { ANKLE_DORSIFLEXION, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../actions/walkLeg";
import { HumanFoot } from "../posture/HumanFoot";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A foot kept within the ankle's dorsal range for the weight it bears. A
 * foot bearing the body dorsiflexes as far as the loaded limit, one bearing
 * nothing only to the passive one (`ANKLE_DORSIFLEXION`), and the limit
 * between follows the share of the weight (`walkLeg.dorsal`). A law that
 * carries a foot at a placement of its own (held flat, or turned as it was
 * set down) would ask the ankle past that limit whenever the shank leans
 * over it, so the placement's heel is raised about the toes' joint as the
 * forefoot rocker raises a walking foot's (`walkLeg.heelRise`): the
 * forefoot stays where the law put it, so a foot on the floor rises onto
 * its ball rather than driving its toes into the floor; a foot in the air
 * turns about its ankle (`walkLeg.prepareAnkleRange`). A foot leaving a
 * plant sheds its weight over the last `LEAD` seconds of the plant
 * (`load`), so its heel is already up within the passive limit when it
 * leaves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two limits, the weight's share, the rocker, the fixed forefoot and the shedding before a lift.
 * @evidence contracts/development/design.md#principled-representation A pure correction of a foot placement against the load's dorsal range.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The lead, the load share and one correction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The limits are the engine's range constants; the rocker and the hips are the walk's and the body's own.
 */
export namespace AutoMovieMotionHumanFootRelax {
  /** Seconds before a lift over which a planted foot sheds its weight (provisional: a tenth of a second, a walking weight shift's order). */
  export const LEAD: number = 0.1;

  /**
   * The share of the weight a planted foot bears as it nears its lift.
   *
   * @param seconds The action second.
   * @param leave The second the foot lifts.
   * @returns 1 until `LEAD` before the lift, falling on a minimum-jerk share to 0 at it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the share and its fall.
   * @evidence contracts/development/implementation.md#principled-implementation A minimum-jerk fall over the lead, so the heel's rise is smooth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamp and one share.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reaches exactly 0 at the lift.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared minimum-jerk share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function load(seconds: number, leave: number): number {
    return minimumJerk.share(
      Math.min(1, Math.max(0, (leave - seconds) / LEAD)),
    );
  }

  /**
   * The placement a foot bearing a share of the weight can hold.
   *
   * @param body The body.
   * @param posture The posture written so far, read for its root, heading and pelvis.
   * @param side Which foot.
   * @param placement The placement the law asks.
   * @param share The share of the weight the foot bears, 0 to 1; none when absent.
   * @param grounded Whether the forefoot is on the floor, so the heel rises about it; a foot in the air turns about its ankle instead.
   * @returns The placement with its heel raised about the toes' joint where the ask would pass the limit, else the ask.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the correction.
   * @evidence contracts/development/implementation.md#principled-implementation The hip joint from the posture's root, heading and pelvis; the pitch the forefoot rocker keeps within the load's dorsal limit; the foot pivoted there about its toes' joint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Hip, limit, rocker, pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot within the limit is returned unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One hip read and one bounded rocker search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The walk's rocker and dorsal limit, the shared hip reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    share: number = 0,
    grounded: boolean = true,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    const hip: IAutoMovieVector3 = hipJoints(
      body,
      posture.root,
      resolveHumanPosture.heading(posture),
      posture.joints.hips,
      prepareHumanPoseResolution()(),
    )[side];
    const direction: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(placement.rotation);
    // A foot in the air turns about its ankle within the passive range.
    if (!grounded) {
      const rotation: IAutoMovieQuaternion = walkLeg.prepareAnkleRange(
        body,
        direction.heading,
      )(hip, placement.ankle, placement.rotation);
      return rotation === placement.rotation
        ? placement
        : { ankle: placement.ankle, rotation };
    }
    const forefoot: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      "mtp",
      placement,
    );
    const dorsal: number =
      share > 0 ? walkLeg.dorsal(share) : ANKLE_DORSIFLEXION.unloaded;
    const pitch: number = walkLeg.heelRise(
      body,
      side,
      hip,
      forefoot,
      direction.heading,
      direction.pitch,
      walkLeg.ROCKER,
      dorsal,
    );
    if (pitch === direction.pitch) return placement;
    return HumanFoot.pivot(
      body,
      side,
      "mtp",
      forefoot,
      direction.heading,
      pitch,
      0,
      HumanFoot.roll(placement.rotation),
    );
  }
}
