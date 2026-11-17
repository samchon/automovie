import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFootRotation } from "../posture/HumanFootRotation";
import type { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";

/**
 * A planted foot of a stepping gait as its leg can hold it under a hip
 * (`walkReach.ground` places each stance by it): a stance whose shank leans
 * toward the ankle's dorsal limit raises its heel about its ball
 * (`walkLeg.heelRise`), or lowers its toes about its heel in the heel
 * rocker; one whose thigh would trail more than `TRAIL` raises its heel
 * further, by the same rounded rule from `EASE` short of it on; a foot
 * pivots on its toe pad by the turn it is given; and a foot whose leg leans
 * further to its side than `SIDE` rolls onto its edge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four rules a stance is held by and their bounds.
 * @evidence contracts/development/design.md#principled-representation One stance rule apart from the pelvis's settling, which calls it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds and the rule.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every limit is the ankle's or the hip's range, cited where it is set.
 */
export namespace walkReachStance {
  /** The furthest a planted leg's thigh trails behind vertical, degrees: the 20° of terminal stance (Perry and Burnfield), inside the hip's 30° extension. */
  export const TRAIL: number = 20;

  /** The trail short of `TRAIL`, degrees, from which a planted foot's heel begins to rise for it (provisional): a thigh extending at a walk's few hundred degrees per second is brought to rest over the rounding, twice this wide, with an acceleration of the square of that rate over four times the width. */
  export const EASE: number = 8;

  /** The furthest a planted leg's line leans to the side of its foot before the foot rolls onto its edge, degrees: the ankle's 25 degrees of inversion and eversion (DEFAULT_HUMANOID_ROM). */
  export const SIDE: number = 25;
  /**
   * A stance as its leg can hold it under a hip: the heel raised about the
   * ball, or the toes lowered about the heel, the foot pivoted on its toe pad,
   * and rolled onto its edge under a leg leaning past the ankle's side range.
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
   * @evidence contracts/development/implementation.md#principled-implementation The forefoot rocker begins where the ankle can bend no further and the trailing thigh is held at terminal stance's (Perry and Burnfield), so the ball never slides; past the ankle's side range the foot turns about the border that stays down, so that border never slides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The rocker, the trail, the pivot, then the edge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raising the heel only brings the thigh forward, so the trail's room has no fold to search.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four rocker passes, one rounded rise and one pass over the sole's points.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `walkLeg` and `HumanFoot`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    foot: IAutoMovieMotionHumanWalkFoot.IFoot,
    h: IAutoMovieVector3,
    yaw: number,
    pivoted: number,
    rocker: number,
    course?: number,
  ): { end: walkFoot.IEnd; contact: IAutoMovieVector3 } {
    return prepare(body, side, foot, yaw, pivoted, rocker, course)(h);
  }

  /**
   * Prepare a scheduled stance while its hip varies in the root's height solve.
   *
   * @param body The fixed body.
   * @param side The foot.
   * @param foot The scheduled foot's fixed placement and toe flexion.
   * @param yaw The fixed pelvis heading, degrees.
   * @param pivoted The fixed toe-pad turn, degrees.
   * @param rocker The fixed rocker onset room, degrees.
   * @param course The fixed course pitch, degrees, when a stance course owns it.
   * @returns The unchanged stance rule evaluated at each hip in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which stance inputs remain fixed, angular units and the varying world-space hip.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves only the foot's heading, initial pitch, sole pivot and rigid pivot reader once; each hip still runs every original rocker, trail, pivot and edge-range rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed stance geometry precedes one hip reader, keeping the constraint rules and their ordering in one owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all search calls, iterations, range bounds, sole probes and contact formulas; no trial hip or fit result is memoized.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation per scheduled stance and the original bounded constraint work per hip; repeated root trials skip fixed quaternion decompositions, socket/pivot setup and heading-axis preparation for lean/trail. A toe-pad turn lazily prepares fixed yaw/roll and socket geometry, then computes its actual toe-angle offset once for both original rigid transforms.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side, scheduled foot, pelvis heading, pivot turn, rocker width and course pitch determine the shared geometry. Each toe-pad turn's current articulated offset is identical under its old and new rotation, so that same local value serves both transforms; every trial still computes its own changing toe angle and placed contact.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader retains one fixed foot and rigid-pivot reader until its root solve and deferred endpoint result release it, with no hip/query history.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    foot: IAutoMovieMotionHumanWalkFoot.IFoot,
    yaw: number,
    pivoted: number,
    rocker: number,
    course?: number,
  ): (hip: IAutoMovieVector3) => { end: walkFoot.IEnd; contact: IAutoMovieVector3 } {
    const initial: IAutoMovieMotionHumanFoot.IPlacement = foot.placement;
    const direction: ReturnType<typeof HumanFoot.headingPitch> = HumanFoot.headingPitch(initial.rotation);
    const heading: number = direction.heading;
    const starting: number = direction.pitch;
    // A foot is toes-up, and so turns about its heel, only by a pitch a
    // solver resolves: a placement read back from a posed foot carries the
    // pose's rounding (a few millionths of a degree either way), and a flat
    // foot must not become a heel strike by its sign. Within the joints'
    // resolution of flat (`ROM_TOLERANCE`) the foot stands on its ball.
    const about: "heel" | "mtp" = starting > ROM_TOLERANCE ? "heel" : "mtp";
    const pivot: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      about,
      initial,
    );
    const at: (degrees: number) => IAutoMovieMotionHumanFoot.IPlacement =
      HumanFoot.preparePivot(body, side, about, pivot, heading);
    const contact: IAutoMovieVector3 = HumanFoot.offset(body, side, about);
    const bears: boolean = !(course !== undefined && about === "mtp") &&
      HumanFoot.point(body, side, about === "heel" ? "heel" : "toe", initial, foot.toes).y < 0.01;
    let rockerRise: ReturnType<typeof walkLeg.prepareHeelRise> | undefined;
    let sole: ReturnType<typeof HumanFoot.prepareSole> | undefined;
    let turning: ReturnType<typeof HumanFootRotation.prepare> | undefined;
    let toeOffset: ReturnType<typeof HumanFoot.prepareOffset> | undefined;
    const lean: ReturnType<typeof walkLeg.prepareLean> | undefined =
      (about === "heel" && bears) || (about === "mtp" && course === undefined)
        ? walkLeg.prepareLean(body, heading) : undefined;
    let trailing: ReturnType<typeof walkLeg.prepareTrailing> | undefined;
    let trailAnkle: ReturnType<typeof HumanFoot.prepareAnkle> | undefined;
    return (h: IAutoMovieVector3): { end: walkFoot.IEnd; contact: IAutoMovieVector3 } => {
      let placement: IAutoMovieMotionHumanFoot.IPlacement = initial;
      let pitch: number = starting;
      // The heel rises about the ball once the shank leans past the ankle's
      // dorsal limit: the forefoot rocker begins where the ankle can bend no
      // further (Perry and Burnfield), so the ball never slides. A heel
      // strike's toes come down about the heel the same way.
      // A stance course (`walkStanceCourse`) gives the pitch about the ball
      // the take's optimisation chose; the rules below are the take's without one.
      if (course !== undefined && about === "mtp") {
        pitch = Math.min(pitch, course);
        placement = at(pitch);
      } else if (bears)
        if (about === "heel")
          for (let k: number = 0; k < 4; k++) {
            const top: number =
              -lean!(h, placement.ankle) +
              20 -
              walkLeg.ANKLE;
            if (pitch <= top + 1e-6) break;
            pitch = Math.max(0, top);
            placement = at(pitch);
          }
        else {
          const risen: number = (rockerRise ??= walkLeg.prepareHeelRise(
            body,
            side,
            pivot,
            heading,
            rocker,
          ))(h, pitch);
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
      if (about === "mtp" && course === undefined) {
        const risen: number = walkLeg.rise(
          (degrees: number): number => {
            // The search keeps no placement, so it reads the ankle alone; the
            // record is the reader's own, read here before its next pitch.
            const ankle: IAutoMovieVector3 = (trailAnkle ??= HumanFoot.prepareAnkle(body, side, about, pivot, heading))(degrees);
            return degrees + lean!(h, ankle) + 50 >
              walkLeg.ANKLE
              ? TRAIL - (trailing ??= walkLeg.prepareTrailing(body, yaw))(h, ankle)
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
        const local: IAutoMovieVector3 = (toeOffset ??= HumanFoot.prepareOffset(body, side, "toe"))(toes);
        const pad: IAutoMovieVector3 = Vector3.add(placement.ankle, Quaternion.rotateVector(placement.rotation, local));
        const turned: IAutoMovieQuaternion = (turning ??= HumanFootRotation.prepare(heading + pivoted, 0))(pitch);
        placement = {
          ankle: Vector3.subtract(
            pad,
            Quaternion.rotateVector(
              turned,
              local,
            ),
          ),
          rotation: turned,
        };
      }
      // The foot rolls onto its edge once the leg's line leans further to the
      // side of the foot than the ankle inverts or everts: the border on the
      // side the ankle lies from the hip stays on the floor and the other
      // rises, as a foot set wide of the body bears on its outer border.
      const across: IAutoMovieVector3 = flat(
        Quaternion.rotateVector(placement.rotation, { x: 1, y: 0, z: 0 }),
      );
      const aside: number = Vector3.dot(
        Vector3.subtract(placement.ankle, h),
        across,
      );
      const down: number = h.y - placement.ankle.y;
      const excess: number =
        (Math.atan2(Math.abs(aside), down) * 180) / Math.PI - SIDE;
      if (down > 0 && excess > 0) {
        const sign: number = Math.sign(aside);
        let edge: IAutoMovieVector3 = placement.ankle;
        let most: number = -Infinity;
        for (const q of (sole ??= HumanFoot.prepareSole(body, side))(placement)) {
          const out: number =
            sign * Vector3.dot(Vector3.subtract(q, placement.ankle), across);
          if (out > most) {
            most = out;
            edge = q;
          }
        }
        const roll: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          flat(Quaternion.rotateVector(placement.rotation, { x: 0, y: 0, z: 1 })),
          -sign * excess,
        );
        placement = {
          ankle: Vector3.add(
            edge,
            Quaternion.rotateVector(
              roll,
              Vector3.subtract(placement.ankle, edge),
            ),
          ),
          rotation: Quaternion.normalize(
            Quaternion.multiply(roll, placement.rotation),
          ),
        };
      }
      return {
        end: { ankle: placement.ankle, rotation: placement.rotation, toes },
        contact,
      };
    };
  }

  /** The original normalized horizontal direction of an actual rotated foot axis. */
  function flat(v: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.normalize({ x: v.x, y: 0, z: v.z });
  }
}
