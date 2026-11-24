import {
  ANKLE_DORSIFLEXION,
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFootRotation } from "../posture/HumanFootRotation";
import { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";

/** The record of `IPrepareResult2`'s site. */
type IPrepareResult2 = { end: walkFoot.IEnd; contact: IAutoMovieVector3 };

/** The alternatives of `PrepareAbout`'s site. */
type PrepareAbout = "heel" | "mtp";

/** The record of `IPrepareResult`'s site. */
type IPrepareResult = {
  end: walkFoot.IEnd;
  contact: IAutoMovieVector3;
};

/** The alternatives of `SIDEBone`'s site. */
type SIDEBone = "leftFoot" | "rightFoot";

/**
 * A planted foot of a stepping gait as its leg can hold it under a hip
 * (`walkReach.ground` places each stance by it): a stance whose shank leans
 * toward the ankle's dorsal limit raises its heel about its ball
 * (`walkLeg.heelRise`), or lowers its toes about its heel in the heel rocker,
 * the heel rise its flat foot would keep coming in by the heel rocker's
 * progress so the rocker hands over to the ball with the same height and rate;
 * one whose thigh would trail more than `TRAIL` raises its heel further, by the
 * same rounded rule from `EASE` short of it on; a foot pivots on its toe pad by
 * the turn it is given; and a foot whose leg leans further to its side than
 * `SIDE` rolls onto the border nearer its hip.
 */
export namespace walkReachStance {
  /**
   * The furthest a planted leg's thigh trails behind vertical, degrees: the 20°
   * of terminal stance (Perry and Burnfield), inside the hip's 30° extension.
   */
  export const TRAIL: number = 20;

  /**
   * The trail short of `TRAIL`, degrees, from which a planted foot's heel
   * begins to rise for it (provisional): a thigh extending at a walk's few
   * hundred degrees per second is brought to rest over the rounding, twice this
   * wide, with an acceleration of the square of that rate over four times the
   * width.
   */
  const EASE: number = 8;

  /**
   * The furthest a planted leg's line leans to the side of its foot before the
   * foot rolls onto its edge, degrees: the ankle's inversion and eversion in
   * the range table (`DEFAULT_HUMANOID_ROM`, 25° each way on either foot, the
   * least taken).
   */
  export const SIDE: number = Math.min(
    ...(["leftFoot", "rightFoot"] as const).flatMap(
      (bone: SIDEBone): number[] => {
        const abduction: IAutoMovieAngleRange | null | undefined =
          DEFAULT_HUMANOID_ROM[bone]?.abduction;
        if (abduction === null || abduction === undefined)
          throw new Error(
            `The range-of-motion table gives ${bone} no inversion or eversion`,
          );
        return [-abduction.min, abduction.max];
      },
    ),
  );

  /**
   * Prepare a scheduled stance while its hip varies in the root's height solve:
   * the heel raised about the ball, or the toes lowered about the heel, the
   * foot pivoted on its toe pad, and rolled onto its edge under a leg leaning
   * past the ankle's side range.
   *
   * @param body The fixed body.
   * @param side The foot.
   * @param foot The scheduled foot's fixed placement and toe flexion.
   * @param yaw The fixed pelvis heading, degrees.
   * @param pivoted The fixed toe-pad turn, degrees.
   * @param rocker The fixed rocker onset room, degrees.
   * @param dorsal The ankle's dorsal limit, degrees, by the weight the foot
   *   bears (`walkLeg.dorsal`); an unloaded foot's when absent.
   * @returns The stance rule evaluated at a hip in world metres: the stance as
   *   reached and its contact point in the foot's frame.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    foot: IAutoMovieMotionHumanWalkFoot.IFoot,
    yaw: number,
    pivoted: number,
    rocker: number,
    dorsal: number = ANKLE_DORSIFLEXION.unloaded,
  ): (hip: IAutoMovieVector3) => IPrepareResult {
    const initial: IAutoMovieMotionHumanFoot.IPlacement = foot.placement;
    const direction: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(initial.rotation);
    const heading: number = direction.heading;
    const starting: number = direction.pitch;
    // A foot is toes-up, and so turns about its heel, only by a pitch a
    // solver resolves: a placement read back from a posed foot carries the
    // pose's rounding (a few millionths of a degree either way), and a flat
    // foot must not become a heel strike by its sign. Within the joints'
    // resolution of flat (`ROM_TOLERANCE`) the foot stands on its ball.
    const about: PrepareAbout = starting > ROM_TOLERANCE ? "heel" : "mtp";
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
      HumanFoot.point(
        body,
        side,
        about === "heel" ? "heel" : "toe",
        initial,
        foot.toes,
      ).y < HumanFoot.BEARING;
    let rockerRise: ReturnType<typeof walkLeg.prepareHeelRise> | undefined;
    let sole: ReturnType<typeof HumanFoot.prepareSole> | undefined;
    let turning: ReturnType<typeof HumanFootRotation.prepare> | undefined;
    let toeOffset: ReturnType<typeof HumanFoot.prepareOffset> | undefined;
    const lean: ReturnType<typeof walkLeg.prepareLean> | undefined =
      (about === "heel" && bears) || about === "mtp"
        ? walkLeg.prepareLean(body, heading)
        : undefined;
    let trailing: ReturnType<typeof walkLeg.prepareTrailing> | undefined;
    let trailAnkle: ReturnType<typeof HumanFoot.prepareAnkle> | undefined;

    // The heel rocker's progress toward flat: its scheduled pitch falls from
    // `walkFoot.STRIKE` to none on a minimum-jerk profile, so this share
    // rises from 0 at the strike to 1 at the hand-over with zero slope at
    // both ends.
    const handing: number = Math.min(
      1,
      Math.max(0, 1 - starting / walkFoot.STRIKE),
    );
    let ball: IHandover | undefined;
    return (h: IAutoMovieVector3): IPrepareResult2 => {
      let placement: IAutoMovieMotionHumanFoot.IPlacement = initial;
      let pitch: number = starting;
      let held: IAutoMovieVector3 = contact;
      // The heel rises about the ball once the shank leans past the ankle's
      // dorsal limit: the forefoot rocker begins where the ankle can bend no
      // further (Perry and Burnfield), so the ball never slides. A heel
      // strike's toes come down about the heel the same way, to the fixed
      // point where the lowered toes leave the shank at that limit.
      if (bears)
        if (about === "heel") {
          let first: number | undefined;
          for (let k: number = 0; k < TOES_DOWN; k++) {
            const top: number =
              -lean!(h, placement.ankle) + dorsal - walkLeg.ANKLE;
            first ??= top;
            if (pitch <= top + SETTLED) break;
            pitch = Math.max(0, top);
            placement = at(pitch);
          }

          // The forefoot rocker the flat foot keeps under this hip comes in
          // by the heel rocker's progress, so at the hand-over the stance
          // has the height and the rate the ball's rule gives it: the two
          // turns add, about the heel while the sum is toes-up and about the
          // ball once it is heel-up, and both pivots give the flat foot
          // where the sum is none.
          // A flat foot the straight leg cannot yet reach asks nothing: its
          // heel rise would be the reach's, not the ankle's. A strike whose
          // flat foot is already past the dorsal limit cannot stand on its
          // heel: the ball rocker comes in by that deficit over the rocker's
          // own rounding width, whole once the deficit is the width.
          const weight: number = Math.max(
            handing,
            rocker > 0 ? Math.min(1, Math.max(0, -(first ?? 0) / rocker)) : 0,
          );
          ball ??= handover(body, side, at(0), heading, rocker, dorsal);
          if (weight > 0 && Vector3.distance(ball.flat, h) <= ball.span) {
            const risen: number = ball.rise(h, 0);
            if (risen < 0) {
              pitch += weight * risen;
              if (pitch >= 0) placement = at(pitch);
              else {
                placement = ball.at(pitch);
                held = ball.contact;
              }
            }
          }
        } else {
          const risen: number = (rockerRise ??= walkLeg.prepareHeelRise(
            body,
            side,
            pivot,
            heading,
            rocker,
            dorsal,
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
            const ankle: IAutoMovieVector3 = (trailAnkle ??=
              HumanFoot.prepareAnkle(body, side, about, pivot, heading))(
              degrees,
            );
            const room = (): number =>
              TRAIL -
              (trailing ??= walkLeg.prepareTrailing(body, yaw))(h, ankle);
            const asked: number | undefined =
              degrees === pitch ? room() : undefined;
            // Both outcomes of the plantar test admit the asked pitch here.
            if (asked !== undefined && asked >= EASE) return asked;
            return degrees + lean!(h, ankle) + walkLeg.PLANTAR > walkLeg.ANKLE
              ? (asked ?? room())
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
        const local: IAutoMovieVector3 = (toeOffset ??= HumanFoot.prepareOffset(
          body,
          side,
          "toe",
        ))(toes);
        const pad: IAutoMovieVector3 = Vector3.add(
          placement.ankle,
          Quaternion.rotateVector(placement.rotation, local),
        );
        const turned: IAutoMovieQuaternion = (turning ??=
          HumanFootRotation.prepare(heading + pivoted, 0))(pitch);
        placement = {
          ankle: Vector3.subtract(pad, Quaternion.rotateVector(turned, local)),
          rotation: turned,
        };
      }
      // The foot rolls onto its edge once the leg's line leans further to the
      // side of the foot than the ankle inverts or everts: the shank carries
      // the foot past the ankle's range, so the border nearer the hip stays on
      // the floor and the far one rises, as a foot set wide of the body bears
      // on its inner border.
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
      let bearing: IAutoMovieVector3 = held;
      if (down > 0 && excess > 0) {
        // The border it rolls about is the sole point nearest the hip of those
        // that bear, within the sole's bearing height of its lowest
        // (`HumanFoot.BEARING`): a heel the rocker has raised is not on the
        // floor, and a roll about it would lift the whole foot.
        const sign: number = Math.sign(aside);
        const points: IAutoMovieVector3[] = (sole ??= HumanFoot.prepareSole(
          body,
          side,
        ))(placement);
        const floor: number = Math.min(
          ...points.map((q: IAutoMovieVector3): number => q.y),
        );
        let edge: IAutoMovieVector3 = placement.ankle;
        let most: number = -Infinity;
        for (const q of points) {
          if (q.y > floor + HumanFoot.BEARING) continue;
          const out: number =
            -sign * Vector3.dot(Vector3.subtract(q, placement.ankle), across);
          if (out > most) {
            most = out;
            edge = q;
          }
        }
        const roll: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          flat(
            Quaternion.rotateVector(placement.rotation, { x: 0, y: 0, z: 1 }),
          ),
          sign * excess,
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

        // A rolled foot bears on the border it rolled about, which stays on
        // the floor: that border, in the foot's frame, is its contact, so a
        // leg fit that holds the contact holds the foot where it bears.
        bearing = Quaternion.rotateVector(
          Quaternion.inverse(placement.rotation),
          Vector3.subtract(edge, placement.ankle),
        );
      }
      return {
        end: { ankle: placement.ankle, rotation: placement.rotation, toes },
        contact: bearing,
      };
    };
  }

  /**
   * The heel rocker's passes toward its fixed point, where lowering the toes
   * about the heel leaves the shank at the dorsal limit: a pass of Δ degrees
   * moves the ankle by the heel's lever times Δ, which leans the shank by that
   * over its length, about a sixth of Δ for a heel lever of 7 cm under a 43 cm
   * shank, so the correction shrinks sixfold a pass and four leave under a
   * thousandth of the first.
   */
  const TOES_DOWN: number = 4;

  /**
   * The pitch, degrees, within which a heel rocker's pass has reached its fixed
   * point: a millionth of a degree turns a point of a 0.3 m foot by 5 nm.
   */
  const SETTLED: number = 1e-6;

  /**
   * The least toe-pad pivot, degrees, that turns the foot: a nanodegree turns
   * its toe pad's 0.2 m lever by 3e-12 m, so a smaller pivot is none.
   */
  const STILL: number = 1e-9;

  /** The normalized horizontal direction of a rotated foot axis. */
  function flat(v: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.normalize({ x: v.x, y: 0, z: v.z });
  }

  /**
   * The forefoot rocker of a heel-strike stance: the ball of the flat foot as
   * its fixed pivot, the heel-rise rule a flat stance keeps
   * (`walkLeg.prepareHeelRise`) and the ball as the contact.
   */
  function handover(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    flatFoot: IAutoMovieMotionHumanFoot.IPlacement,
    heading: number,
    rocker: number,
    dorsal: number,
  ): IHandover {
    const pivot: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      "mtp",
      flatFoot,
    );
    return {
      at: HumanFoot.preparePivot(body, side, "mtp", pivot, heading),
      rise: walkLeg.prepareHeelRise(body, side, pivot, heading, rocker, dorsal),
      contact: HumanFoot.offset(body, side, "mtp"),
      flat: flatFoot.ankle,
      span: body.measure.thigh + body.measure.shank,
    };
  }
}

/** A heel-strike stance's forefoot rocker, prepared on its first hip. */
interface IHandover {
  /** The flat foot's ankle, world metres. */
  flat: IAutoMovieVector3;

  /**
   * The leg's length, hip to ankle, metres: the reach the flat foot must lie
   * within.
   */
  span: number;

  /** The foot pitched about its ball, degrees negative heel up. */
  at: (degrees: number) => IAutoMovieMotionHumanFoot.IPlacement;

  /** The pitch the heel rises to under a hip from a flat foot. */
  rise: (hip: IAutoMovieVector3, pitch: number, dorsalAt?: number) => number;

  /** The ball in the foot's frame, the contact while the heel is up. */
  contact: IAutoMovieVector3;
}
