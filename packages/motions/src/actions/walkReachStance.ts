import {
  ANKLE_DORSIFLEXION,
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three bounds and the prepared rule, read by `walkReach`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every limit is the ankle's or the hip's range, cited where it is set.
 */
export namespace walkReachStance {
  /** The furthest a planted leg's thigh trails behind vertical, degrees: the 20° of terminal stance (Perry and Burnfield), inside the hip's 30° extension. */
  export const TRAIL: number = 20;

  /** The trail short of `TRAIL`, degrees, from which a planted foot's heel begins to rise for it (provisional): a thigh extending at a walk's few hundred degrees per second is brought to rest over the rounding, twice this wide, with an acceleration of the square of that rate over four times the width. */
  const EASE: number = 8;

  /** The furthest a planted leg's line leans to the side of its foot before the foot rolls onto its edge, degrees: the ankle's inversion and eversion in the range table (`DEFAULT_HUMANOID_ROM`, 25° each way on either foot, the least taken). */
  export const SIDE: number = Math.min(
    ...(["leftFoot", "rightFoot"] as const).flatMap((bone: "leftFoot" | "rightFoot"): number[] => {
      const abduction: IAutoMovieAngleRange | null | undefined = DEFAULT_HUMANOID_ROM[bone]?.abduction;
      if (abduction === null || abduction === undefined)
        throw new Error(`The range-of-motion table gives ${bone} no inversion or eversion`);
      return [-abduction.min, abduction.max];
    }),
  );

  /**
   * Prepare a scheduled stance while its hip varies in the root's height
   * solve: the heel raised about the ball, or the toes lowered about the
   * heel, the foot pivoted on its toe pad, and rolled onto its edge under a
   * leg leaning past the ankle's side range.
   *
   * @param body The fixed body.
   * @param side The foot.
   * @param foot The scheduled foot's fixed placement and toe flexion.
   * @param yaw The fixed pelvis heading, degrees.
   * @param pivoted The fixed toe-pad turn, degrees.
   * @param rocker The fixed rocker onset room, degrees.
   * @returns The stance rule evaluated at a hip in world metres: the stance as reached and its contact point in the foot's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which stance inputs stay fixed, angular units and the varying world-space hip.
   * @evidence contracts/development/implementation.md#principled-implementation The forefoot rocker begins where the ankle can bend no further and the trailing thigh is held at terminal stance's (Perry and Burnfield), so the ball never slides; past the ankle's side range the foot turns about the border that stays down, so that border never slides. The foot's heading, initial pitch, sole pivot and rigid pivot reader are resolved once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed stance geometry precedes one hip reader running the rocker, the trail, the pivot, then the edge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raising the heel only brings the thigh forward, so the trail's room has no fold to search; no trial hip or fit result is memoized.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation per scheduled stance; per hip at most `TOES_DOWN` heel-rocker passes, one rounded rise and one pass over the sole's points. A toe-pad turn lazily prepares its yaw/roll and socket geometry, then computes its toe-angle offset once for both rigid transforms.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side, scheduled foot, pelvis heading, pivot turn and rocker width determine the shared geometry. A toe-pad turn's articulated offset is the same under its old and new rotation, so one local value serves both transforms; every trial computes its own toe angle and placed contact.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader retains one fixed foot and rigid-pivot reader until its root solve and deferred endpoint result release it, with no hip/query history.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    foot: IAutoMovieMotionHumanWalkFoot.IFoot,
    yaw: number,
    pivoted: number,
    rocker: number,
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

    // The foot bears on the end it turns about where that end lies within
    // the sole's bearing height of the floor (`HumanFoot.BEARING`).
    const bears: boolean =
      HumanFoot.point(body, side, about === "heel" ? "heel" : "toe", initial, foot.toes).y < HumanFoot.BEARING;
    let rockerRise: ReturnType<typeof walkLeg.prepareHeelRise> | undefined;
    let sole: ReturnType<typeof HumanFoot.prepareSole> | undefined;
    let turning: ReturnType<typeof HumanFootRotation.prepare> | undefined;
    let toeOffset: ReturnType<typeof HumanFoot.prepareOffset> | undefined;
    const lean: ReturnType<typeof walkLeg.prepareLean> | undefined =
      (about === "heel" && bears) || about === "mtp"
        ? walkLeg.prepareLean(body, heading) : undefined;
    let trailing: ReturnType<typeof walkLeg.prepareTrailing> | undefined;
    let trailAnkle: ReturnType<typeof HumanFoot.prepareAnkle> | undefined;
    return (h: IAutoMovieVector3): { end: walkFoot.IEnd; contact: IAutoMovieVector3 } => {
      let placement: IAutoMovieMotionHumanFoot.IPlacement = initial;
      let pitch: number = starting;
      // The heel rises about the ball once the shank leans past the ankle's
      // dorsal limit: the forefoot rocker begins where the ankle can bend no
      // further (Perry and Burnfield), so the ball never slides. A heel
      // strike's toes come down about the heel the same way, to the fixed
      // point where the lowered toes leave the shank at that limit.
      if (bears)
        if (about === "heel")
          for (let k: number = 0; k < TOES_DOWN; k++) {
            const top: number =
              -lean!(h, placement.ankle) +
              ANKLE_DORSIFLEXION.unloaded -
              walkLeg.ANKLE;
            if (pitch <= top + SETTLED) break;
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
      if (about === "mtp") {
        const risen: number = walkLeg.rise(
          (degrees: number): number => {
            // The search keeps no placement, so it reads the ankle alone; the
            // record is the reader's own, read here before its next pitch.
            const ankle: IAutoMovieVector3 = (trailAnkle ??= HumanFoot.prepareAnkle(body, side, about, pivot, heading))(degrees);
            return degrees + lean!(h, ankle) + walkLeg.PLANTAR >
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
      if (about === "mtp" && Math.abs(pivoted) > STILL) {
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

  /**
   * The heel rocker's passes toward its fixed point, where lowering the toes
   * about the heel leaves the shank at the dorsal limit: a pass of Δ degrees
   * moves the ankle by the heel's lever times Δ, which leans the shank by
   * that over its length, about a sixth of Δ for a heel lever of 7 cm under
   * a 43 cm shank, so the correction shrinks sixfold a pass and four leave
   * under a thousandth of the first.
   */
  const TOES_DOWN: number = 4;

  /** The pitch, degrees, within which a heel rocker's pass has reached its fixed point: a millionth of a degree turns a point of a 0.3 m foot by 5 nm. */
  const SETTLED: number = 1e-6;

  /** The least toe-pad pivot, degrees, that turns the foot: a nanodegree turns its toe pad's 0.2 m lever by 3e-12 m, so a smaller pivot is none. */
  const STILL: number = 1e-9;

  /** The normalized horizontal direction of a rotated foot axis. */
  function flat(v: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.normalize({ x: v.x, y: 0, z: v.z });
  }
}
