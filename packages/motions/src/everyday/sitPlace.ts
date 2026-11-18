import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { HumanRefusal } from "../law/HumanRefusal";
import { hipJoints } from "../posture/hipJoints";
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The leg's reach is the body's own measure and the knee's limit is read from the range table.
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

  /** The farthest a seated leg reaches its ankle, as a share of its full length: just short of a locked knee (provisional). */
  const STRAIGHT: number = 0.995;

  /**
   * Refuse feet the legs cannot reach from the seated hips: each ankle must
   * lie within `STRAIGHT` of the leg's length from its hip joint and beyond
   * the distance a knee flexed to the range table's limit leaves.
   *
   * @param body The body.
   * @param seat The seat.
   * @param goal The socket's point on the seat.
   * @param feet The planted ankles.
   * @param pitch The seated pitch, degrees.
   * @throws {HumanRefusal} When a foot is out of reach, with the reachable distances ahead of the front edge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reachable band and the refusal's range.
   * @evidence contracts/development/implementation.md#principled-implementation The hip joints by FK under the seated root; the band's ends by the law of cosines for a knee at `STRAIGHT` and at the range table's flexion limit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One root, two hips and one band test per foot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot outside the band is refused with the distances that work, never moved.
   * @evidence contracts/development/implementation.md#efficient-algorithms One two-hip FK read and constant work per foot.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the hip joints from `hipJoints` and the knee's limit from `AutoMovieMotionHumanRange`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
    const longest: number = STRAIGHT * (m.thigh + m.shank);
    const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      root,
      resolveHumanPosture.heading({ yaw: seat.yaw, pitch, roll: 0 }),
    );
    for (const side of ["left", "right"] as const) {
      // The knee's interior angle at its flexion limit.
      const limit: number | null = AutoMovieMotionHumanRange.limit(`${side}LowerLeg`, "flexion");
      if (limit === null) throw new Error(`${side}LowerLeg has no flexion limit`);
      const folded: number = 180 - limit;
      const shortest: number = Math.sqrt(
        m.thigh * m.thigh +
          m.shank * m.shank -
          2 * m.thigh * m.shank * Math.cos((folded * Math.PI) / 180),
      );
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the interval and its open end.
   * @evidence contracts/development/implementation.md#principled-implementation The remainder by a full turn moved into the half-open interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One remainder and two corrections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function turn(degrees: number): number {
    let a: number = degrees % 360;
    if (a > 180) a -= 360;
    if (a <= -180) a += 360;
    return a;
  }
}
