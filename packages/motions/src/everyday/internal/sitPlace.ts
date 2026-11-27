import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/AutoMovieMotionHumanRange";
import { HumanRefusal } from "../../law/HumanRefusal";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/humanPostureHeading";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { seated } from "./seated";

/** The record of `IBACKSEntryItem`'s site. */
type IBACKSEntryItem = {
  pitch: number;
  joints: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  >;
};

/** The alternatives of `BACKSEntryItem`'s site. */
type BACKSEntryItem = "upright" | "lean" | "slump";

/**
 * Where and how a sit sits: the backs it settles into, the feet the seated legs
 * reach and the turn the performer stands at from the seat's heading, the last
 * two refused with the range that works.
 */
export namespace sitPlace {
  /**
   * Seated pitch and trunk angles of each back the sit settles into, degrees:
   * `upright`, `lean` (back onto a backrest) and `slump` (provisional).
   */
  export const BACKS: Readonly<Record<BACKSEntryItem, IBACKSEntryItem>> = {
    upright: { pitch: 0, joints: {} },
    lean: { pitch: -12, joints: {} },
    slump: { pitch: -10, joints: { chest: [12, 0, 0], spine: [8, 0, 0] } },
  };

  /**
   * The distances from a hip joint at which a leg places its ankle, metres: the
   * knee flexed to the range table's limit (`AutoMovieMotionHumanRange`) at the
   * near end, and at the far end the knee kept at the least flexion of a
   * planted leg (`lowerHumanPosture.KNEE`, Perry and Burnfield's knee at
   * initial contact), each by the law of cosines on the thigh and the shank.
   * Sitting, getting onto a high seat and getting off it place feet within this
   * one band.
   *
   * @param body The body.
   * @param side The leg.
   * @returns The least and the greatest distance.
   * @throws {Error} When the range table gives the knee no flexion limit.
   */
  export function band(
    body: { measure: Pick<IAutoMovieBodyMeasure, "thigh" | "shank"> },
    side: AutoMovieHumanSide,
  ): readonly [number, number] {
    const m: Pick<IAutoMovieBodyMeasure, "thigh" | "shank"> = body.measure;
    const limit: number | null = AutoMovieMotionHumanRange.limit(
      `${side}LowerLeg`,
      "flexion",
    );
    if (limit === null) throw new Error(`${side}LowerLeg has no flexion limit`);
    const chord = (flexion: number): number =>
      Math.sqrt(
        m.thigh * m.thigh +
          m.shank * m.shank +
          2 * m.thigh * m.shank * Math.cos((flexion * Math.PI) / 180),
      );
    return [chord(limit), chord(lowerHumanPosture.KNEE)];
  }

  /**
   * Refuse feet the legs cannot reach from the seated hips: each ankle must lie
   * within the leg's reachable band from its hip joint (`band`).
   *
   * @param body The body.
   * @param seat The seat.
   * @param goal The socket's point on the seat.
   * @param feet The planted ankles.
   * @param pitch The seated pitch, degrees.
   * @throws {HumanRefusal} When a foot is out of reach, with the reachable
   *   distances ahead of the front edge.
   */
  export function reach(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    goal: IAutoMovieVector3,
    feet: Record<AutoMovieHumanSide, IAutoMovieVector3>,
    pitch: number,
  ): void {
    const root: IAutoMovieVector3 = seated.root(body, goal, {
      yaw: seat.yaw,
      pitch,
      roll: 0,
    });

    const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
      body,
      root,
      humanPostureHeading({ yaw: seat.yaw, pitch, roll: 0 }),
    );
    for (const side of ["left", "right"] as const) {
      const [shortest, longest]: readonly [number, number] = band(body, side);
      const hip: IAutoMovieVector3 = hips[side];
      const d: number = Vector3.length(Vector3.subtract(feet[side], hip));
      if (d > longest || d < shortest) {
        const dy: number = hip.y - feet[side].y;
        const near: number = Math.sqrt(
          Math.max(0, shortest * shortest - dy * dy),
        );
        const far: number = Math.sqrt(Math.max(0, longest * longest - dy * dy));
        const edge: number = Math.hypot(hip.x - seat.at.x, hip.z - seat.at.z);
        throw new HumanRefusal({
          kind: "reach",
          axis: "seat",
          value: d,
          reason: `The ${side} ankle is ${d.toFixed(3)} m from its seated hip; stand with the ankles ${Math.max(0, near - edge).toFixed(3)} to ${(far - edge).toFixed(3)} m ahead of the seat's front edge`,
          fix: `stand with the ankles ${Math.max(0, near - edge).toFixed(3)} to ${(far - edge).toFixed(3)} m ahead of the seat's front edge`,
        });
      }
    }
  }

  /**
   * An angle wrapped into (-180, 180].
   *
   * @param degrees The angle.
   * @returns The same turn within (-180, 180].
   */
  export function turn(degrees: number): number {
    let a: number = degrees % 360;
    if (a > 180) a -= 360;
    if (a <= -180) a += 360;
    return a;
  }
}
