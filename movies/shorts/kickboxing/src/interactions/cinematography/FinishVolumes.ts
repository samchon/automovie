import {
  Quaternion,
  Vector3,
  type IAutoMovieSchedule,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { FighterBody } from "../../entities/cast/fighter/FighterBody";
import { SightLaw } from "../../laws/cinematography/SightLaw";
import type { IFighterMeasure } from "../../laws/kickboxing/IFighterMeasure";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { TurnoverShape } from "../../laws/kickboxing/TurnoverShape";
import { FighterPosture } from "../kickboxing/FighterPosture";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RefereeTrack } from "../officiating/RefereeTrack";
import { FinishSight } from "./FinishSight";

/**
 * The finishing strike's sight scene from the shape laws and measure-derived
 * capsules, the visibility law's input for the logic units: the striker's
 * commanded leg over the descent and the struck region, without posing a
 * Human body.
 *
 * ```ts
 * const sight = FinishVolumes.volumes(cast, schedule, referee);
 * FinishVolumes.leg(cast, schedule, entry, 150); // { hip, knee, shin, ankle }
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#targets The finishing strike's leg and contact stay unoccluded and inside the delivered frame.
 * @evidence docs/research/kickboxing/brazilian-kick.md#law The knee climbs over the receiver's shoulder line and the lower leg comes down onto the region.
 */
export namespace FinishVolumes {
  /**
   * The scene from the shape laws and measure-derived capsules, so logic
   * units resolve the law in milliseconds without posing a body. The struck
   * region lies on the receiver's head on its side, a head radius and a
   * half below its top and lowered by his posture's drop at that instant;
   * the watched striking leg is the striker's commanded leg at every frame
   * of the descent: the knee aim, the shin's middle and the ankle goal,
   * where the instep and distal shin meet, from his posture placed at its
   * floor frame. Each body occludes as a leg capsule from ankle to hip, a
   * torso capsule whose cap reaches the shoulder line and a head-and-neck
   * capsule from the shoulder line to the head centre; the volumes carry no
   * arms, so the receiver's defending arm never occludes, as in `colliders`.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param referee The referee's resolved path.
   * @returns The reader.
   */
  export function volumes(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    referee: RefereeTrack.ITrack,
  ): FinishSight.Reader {
    return (entry: IAutoMovieSchedule.IEntry): SightLaw.IScene => {
      const { striker, receiver, contact } = FinishSight.finish(cast, entry);
      const struck = region(cast, schedule, entry);
      const watched: SightLaw.IWatched[] = FinishSight.descent(contact).flatMap(
        (seconds: number): SightLaw.IWatched[] => {
          const leg: ILeg = FinishVolumes.leg(cast, schedule, entry, seconds);
          return [leg.knee, leg.shin, leg.ankle].map((point) => ({
            point,
            seconds,
            carriers: [],
          }));
        },
      );
      watched.push({ point: struck(contact), seconds: contact, carriers: [] });
      const bodies = (
        seconds: number,
      ): { a: IAutoMovieVector3; b: IAutoMovieVector3; radius: number }[] => {
        const r = RefereeTrack.at(referee, seconds).point;
        return [
          ...capsules(
            FinishSight.floor(cast, schedule, striker.id, seconds),
            striker.body.measure,
          ),
          ...capsules(
            FinishSight.floor(cast, schedule, receiver.id, seconds),
            receiver.body.measure,
          ),
          ...capsules(r, cast.referee.body.measure),
        ];
      };
      return {
        contact: struck(contact),
        attacker: FinishSight.floor(cast, schedule, striker.id, contact),
        receiver: FinishSight.floor(cast, schedule, receiver.id, contact),
        seconds: contact,
        watched,
        neighbourhood: receiver.body.measure.headRadius,
        separation: (from, to, seconds): number =>
          Math.min(
            ...bodies(seconds).map((c) =>
              SightLaw.capsule(from, to, c.a, c.b, c.radius),
            ),
          ),
      };
    };
  }

  /** The striker's commanded kicking leg in the world, metres. */
  export interface ILeg {
    /** The kicking hip joint. */
    hip: IAutoMovieVector3;

    /** The knee aim. */
    knee: IAutoMovieVector3;

    /** The ankle goal. */
    ankle: IAutoMovieVector3;

    /** The middle of the shin, between the knee and the ankle. */
    shin: IAutoMovieVector3;
  }

  /**
   * The finishing kick's commanded leg at a second: the striker's shape-law
   * posture, its strike aimed at the region `volumes` reads, placed at his
   * floor frame by the root the performance poses him from.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param entry The finishing strike.
   * @param seconds Film seconds.
   * @returns The leg in the world.
   */
  export function leg(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    entry: IAutoMovieSchedule.IEntry,
    seconds: number,
  ): ILeg {
    const { striker, spec } = FinishSight.finish(cast, entry);
    const struck = region(cast, schedule, entry);
    const posed = FighterPosture.at(
      cast,
      schedule,
      striker.id,
      seconds,
      (_subject: string, _region: string, at: number) => struck(at),
    );
    const lifted = posed.posture.feet[spec.side];
    if (lifted === null || lifted.knee === undefined)
      throw new Error("The finishing kick lifts its leg");
    const root = FighterBody.root(
      posed.posture,
      posed.frame.origin,
      posed.frame.facing,
    );
    const world = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(root.floor, Quaternion.rotateVector(root.rotation, p));
    const m: IFighterMeasure = striker.body.measure;
    const knee: IAutoMovieVector3 = world(lifted.knee);
    const ankle: IAutoMovieVector3 = world(lifted.point);
    return {
      hip: world({
        x: 0,
        y:
          (spec.line === "descending" ? TurnoverShape.hip(m) : m.hip) -
          posed.posture.drop,
        z: (spec.side === "left" ? 1 : -1) * m.hipHalfWidth,
      }),
      knee,
      ankle,
      shin: Vector3.lerp(knee, ankle, 0.5),
    };
  }

  /**
   * The struck region of the measure-derived scene at a second: on the
   * receiver's head on the struck side, a head radius out from its centre
   * line toward that side, a head radius and a half below its top and
   * lowered by his posture's drop.
   */
  function region(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    entry: IAutoMovieSchedule.IEntry,
  ): (seconds: number) => IAutoMovieVector3 {
    const { striker, receiver, spec } = FinishSight.finish(cast, entry);
    const m: IFighterMeasure = receiver.body.measure;
    // The receiver's left is +Z of his own frame facing +X.
    const sign: number = KickboxingTechnique.region(spec).endsWith("-left")
      ? 1
      : -1;
    return (seconds: number): IAutoMovieVector3 => {
      const a = FinishSight.floor(cast, schedule, striker.id, seconds);
      const b = FinishSight.floor(cast, schedule, receiver.id, seconds);
      const dx: number = a.x - b.x;
      const dz: number = a.z - b.z;
      const length: number = Math.hypot(dx, dz) || 1;
      const ahead = { x: dx / length, z: dz / length };
      const drop: number = FighterPosture.at(
        cast,
        schedule,
        receiver.id,
        seconds,
        null,
      ).posture.drop;
      return {
        x: b.x - ahead.z * sign * m.headRadius,
        y: m.head - 1.5 * m.headRadius - drop,
        z: b.z + ahead.x * sign * m.headRadius,
      };
    };
  }

  /** A body's measure capsules at a floor point. */
  function capsules(
    p: { x: number; z: number },
    m: IFighterMeasure,
  ): { a: IAutoMovieVector3; b: IAutoMovieVector3; radius: number }[] {
    const at = (y: number): IAutoMovieVector3 => ({ x: p.x, y, z: p.z });
    return [
      { a: at(m.ankle), b: at(m.hip), radius: m.hipHalfWidth },
      {
        a: at(m.hip),
        b: at(m.shoulder - m.shoulderHalfWidth),
        radius: m.shoulderHalfWidth,
      },
      // The head on its neck: as wide as the head from the shoulder line up.
      { a: at(m.shoulder), b: at(m.head), radius: m.headRadius },
    ];
  }
}
