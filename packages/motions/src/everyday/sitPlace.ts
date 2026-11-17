import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { seated } from "./seated";

/**
 * Where and how a sit sits: the backs it settles into, the feet the seated
 * legs reach and the turn the performer stands at from the seat's heading,
 * the last two refused with the range that works.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the backs and the two checks the sit's plan reads, and that each check refuses with its working range.
 * @evidence contracts/development/design.md#principled-representation Pure functions over the body, the seat and world metres or degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The backs, the feet's reach and the wrapped turn, read by the sit's plan alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The leg's reach is the body's own measure and the knee's 150 degree limit the range table's end.
 */
export namespace sitPlace {
  /** Seated pitch and trunk angles of each back the sit settles into, degrees: `upright`, `lean` (back onto a backrest) and `slump` (provisional). */
  export const BACKS: Readonly<
    Record<
      "upright" | "lean" | "slump",
      {
        pitch: number;
        joints: Partial<
          Record<AutoMovieHumanoidBone, readonly [number, number, number]>
        >;
      }
    >
  > = {
    upright: { pitch: 0, joints: {} },
    lean: { pitch: -12, joints: {} },
    slump: { pitch: -10, joints: { chest: [12, 0, 0], spine: [8, 0, 0] } },
  };

  /**
   * Refuse feet the legs cannot reach from the seated hips: each ankle must
   * lie within 0.995 of the leg's length from its hip joint and beyond the
   * distance a knee flexed to its 150 degree limit leaves.
   *
   * @param body The body.
   * @param seat The seat.
   * @param goal The socket's point on the seat.
   * @param feet The planted ankles.
   * @param pitch The seated pitch, degrees.
   * @throws {HumanRefusal} When a foot is out of reach, with the reachable distances ahead of the front edge.
   */
  export function reach(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    goal: IAutoMovieVector3,
    feet: Record<"left" | "right", IAutoMovieVector3>,
    pitch: number,
  ): void {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const root: IAutoMovieVector3 = seated.root(body, goal, {
      yaw: seat.yaw,
      pitch,
      roll: 0,
    });
    const longest: number = 0.995 * (m.thigh + m.shank);
    const shortest: number = Math.sqrt(
      m.thigh * m.thigh +
        m.shank * m.shank -
        2 * m.thigh * m.shank * Math.cos((30 * Math.PI) / 180),
    );
    for (const side of ["left", "right"] as const) {
      const hipRest: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
      const hip: IAutoMovieVector3 = Vector3.add(
        root,
        Quaternion.rotateVector(
          resolveHumanPosture.heading({ yaw: seat.yaw, pitch, roll: 0 }),
          hipRest,
        ),
      );
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
