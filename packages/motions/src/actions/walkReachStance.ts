import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";

/**
 * A planted foot of a stepping gait as its leg can hold it under a hip
 * (`walkReach.ground` places each stance by it): a stance whose shank leans
 * toward the ankle's dorsal limit raises its heel about its ball
 * (`walkLeg.heelRise`), or lowers its toes about its heel in the heel
 * rocker; one whose thigh would trail more than `TRAIL` raises its heel
 * further, by the same rounded rule from `EASE` short of it on; and a foot
 * pivots on its toe pad by the turn it is given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three rules a stance is held by and their bounds.
 * @evidence contracts/development/design.md#principled-representation One stance rule apart from the pelvis's settling, which calls it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds and the rule.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every limit is the ankle's or the hip's range, cited where it is set.
 */
export namespace walkReachStance {
  /** The furthest a planted leg's thigh trails behind vertical, degrees: the 20° of terminal stance (Perry and Burnfield), inside the hip's 30° extension. */
  export const TRAIL: number = 20;

  /** The trail short of `TRAIL`, degrees, from which a planted foot's heel begins to rise for it (provisional): a thigh extending at a walk's few hundred degrees per second is brought to rest over the rounding, twice this wide, with an acceleration of the square of that rate over four times the width. */
  export const EASE: number = 8;
  /**
   * A stance as its leg can hold it under a hip: the heel raised about the
   * ball, or the toes lowered about the heel, and the foot pivoted on its toe
   * pad.
   *
   * @param body The body.
   * @param side The foot.
   * @param foot The foot as scheduled.
   * @param h Its hip joint, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @param pivoted The foot's pivot turn on its toe pad, degrees.
   * @param rocker The room under which the heel begins to rise, degrees.
   * @returns The stance as reached and its contact point in the foot's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The forefoot rocker begins where the ankle can bend no further and the trailing thigh is held at terminal stance's (Perry and Burnfield), so the ball never slides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The rocker, the trail, then the pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raising the heel only brings the thigh forward, so the trail's room has no fold to search.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four rocker passes and one rounded rise.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `walkLeg` and `HumanFoot`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */ export function of(
    body: IHumanBody,
    side: "left" | "right",
    foot: walkFoot.IFoot,
    h: IAutoMovieVector3,
    yaw: number,
    pivoted: number,
    rocker: number,
  ): { end: walkFoot.IEnd; contact: IAutoMovieVector3 } {
    let placement: HumanFoot.IPlacement = foot.placement;
    const heading: number = HumanFoot.heading(placement.rotation);
    let pitch: number = HumanFoot.pitch(placement.rotation);
    const about: "heel" | "mtp" = pitch > 1e-6 ? "heel" : "mtp";
    const pivot: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      about,
      placement,
    );
    const at = (degrees: number): HumanFoot.IPlacement =>
      HumanFoot.pivot(body, side, about, pivot, heading, degrees);
    // The heel rises about the ball once the shank leans past the ankle's
    // dorsal limit: the forefoot rocker begins where the ankle can bend no
    // further (Perry and Burnfield), so the ball never slides. A heel
    // strike's toes come down about the heel the same way.
    if (
      HumanFoot.point(
        body,
        side,
        about === "heel" ? "heel" : "toe",
        placement,
        foot.toes,
      ).y < 0.01
    )
      if (about === "heel")
        for (let k: number = 0; k < 4; k++) {
          const top: number =
            -walkLeg.lean(body, h, placement.ankle, heading) +
            20 -
            walkLeg.ANKLE;
          if (pitch <= top + 1e-6) break;
          pitch = Math.max(0, top);
          placement = at(pitch);
        }
      else {
        const risen: number = walkLeg.heelRise(
          body,
          side,
          h,
          pivot,
          heading,
          pitch,
          rocker,
        );
        if (risen !== pitch) {
          pitch = risen;
          placement = at(pitch);
        }
      }
    // The heel rises further about the ball while the thigh would trail more
    // than TRAIL behind vertical and the ankle can still plantarflex: the
    // knee then bends and the thigh comes forward, the trailing-limb posture
    // of terminal stance and pre-swing (Perry and Burnfield). The room is the
    // thigh's distance from the bound, and none is asked of a pitch at the
    // ankle's plantar limit. Raising the heel only brings the thigh forward,
    // so this room has no fold.
    if (about === "mtp") {
      const risen: number = walkLeg.rise(
        (degrees: number): number => {
          const ankle: IAutoMovieVector3 = at(degrees).ankle;
          return degrees + walkLeg.lean(body, h, ankle, heading) + 50 >
            walkLeg.ANKLE
            ? TRAIL - walkLeg.trailing(body, h, ankle, yaw)
            : Infinity;
        },
        pitch,
        EASE,
        false,
      );
      if (risen !== pitch) {
        pitch = risen;
        placement = at(pitch);
      }
    }
    const toes: number = Math.max(foot.toes, -pitch);
    // The pivot turn: the foot turns about its toe pad by its pivot.
    if (about === "mtp" && Math.abs(pivoted) > 1e-9) {
      const pad: IAutoMovieVector3 = HumanFoot.point(
        body,
        side,
        "toe",
        placement,
        toes,
      );
      const turned: IAutoMovieQuaternion = HumanFoot.rotation(
        heading + pivoted,
        pitch,
      );
      placement = {
        ankle: Vector3.subtract(
          pad,
          Quaternion.rotateVector(
            turned,
            HumanFoot.offset(body, side, "toe", toes),
          ),
        ),
        rotation: turned,
      };
    }
    return {
      end: { ankle: placement.ankle, rotation: placement.rotation, toes },
      contact: HumanFoot.offset(body, side, about),
    };
  }
}
