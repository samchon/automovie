import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * What a seated rider's own body gives to stay on a mount's parts: the
 * ankle that points a foot down to a pedal the leg would not reach, and
 * the trunk that leans forward to a bar the arms would not reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two adjustments and when each acts.
 * @evidence contracts/development/design.md#principled-representation Each is a pure function of the body, a posture or a goal and world points, returning the same kind of record it was given.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two functions `HumanRide.ride` calls, the one that applies a lean, and their bounds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every bound is named and marked provisional or cited; no mount is named.
 */
export namespace HumanMountRider {
  /** The knee flexion a pedalling leg keeps at the bottom of the stroke, degrees: the low end of the 25 to 35 a saddle is set for (Bini, Hume and Croft 2011, Sports Med 41:463, as the bicycle archetype cites it; not re-read here, so provisional). */
  export const KNEE: number = 25;

  /** The furthest a pedalling foot points down from the pitch it mounted with, degrees (provisional, inside the ankle's 50 of plantar flexion). */
  export const ANKLING: number = 35;

  /** The share of the arm's length, shoulder to wrist, a rider's shoulder is brought within of what the hand holds (provisional: the elbows stay a little bent). */
  export const ARM: number = 0.9;

  /** The most a rider's spine flexes forward to reach what the hands hold, degrees (provisional, inside the spine's 80 of flexion). */
  export const LEAN: number = 60;

  /**
   * A foot goal turned toes-down about its contact until its ankle is
   * within the leg's reach of the hip with the knee `KNEE` bent, no
   * further than `ANKLING`: a cyclist's ankle through the bottom of the
   * stroke.
   *
   * @param body The body.
   * @param side The foot.
   * @param goal The foot's goal on its pedal.
   * @param hip The hip joint, world metres.
   * @param level The rotation a foot whose goal leaves its turn free stands with: level, facing as the body does.
   * @returns The goal, turned about the ball of the foot where the leg would run short; the goal itself where it reaches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what turns, about what, how far and when nothing changes.
   * @evidence contracts/development/implementation.md#principled-implementation The ball stays where the goal puts it and the ankle moves on its circle about the ball's lateral axis; the least turn that reaches is found by bisection, the distance being monotonic in the turn up to `ANKLING`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The ball, the turn as a function of an angle, the distance, the search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pedal beyond even `ANKLING` leaves the foot short of it, which the contact audit reports; a refusal with the saddle height that fits is owed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Twenty-four closed-form evaluations at most.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function ankled(
    body: IHumanBody,
    side: "left" | "right",
    goal: IHumanPosture.IGoal,
    hip: IAutoMovieVector3,
    level: IAutoMovieQuaternion,
  ): IHumanPosture.IGoal {
    const reach: number =
      (body.measure.thigh + body.measure.shank) *
      Math.cos((KNEE * Math.PI) / 360);
    const rotation: IAutoMovieQuaternion = goal.rotation ?? level;

    // A foot on a pedal bears on its ball, whether or not its goal says what it turns about.
    const contact: IAutoMovieVector3 =
      goal.contact ?? HumanFoot.offset(body, side, "ball");
    const ball: IAutoMovieVector3 = Vector3.add(
      goal.point,
      Quaternion.rotateVector(rotation, contact),
    );
    const across: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const turnedBy = (degrees: number): IHumanPosture.IGoal => {
      const pitched: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.fromAxisAngle(across, degrees),
        rotation,
      );
      return {
        ...goal,
        contact,
        rotation: pitched,
        point: Vector3.subtract(ball, Quaternion.rotateVector(pitched, contact)),
      };
    };
    const far = (degrees: number): number =>
      Vector3.length(Vector3.subtract(turnedBy(degrees).point, hip));
    if (far(0) <= reach) return goal;
    const sign: number = far(1) < far(-1) ? 1 : -1;
    if (far(sign * ANKLING) > reach) return turnedBy(sign * ANKLING);
    let low: number = 0;
    let high: number = ANKLING;
    for (let i: number = 0; i < 24; ++i) {
      const middle: number = (low + high) / 2;
      if (far(sign * middle) > reach) low = middle;
      else high = middle;
    }
    return turnedBy(sign * high);
  }

  /**
   * A posture with its spine flexed further forward.
   *
   * @param posture The posture.
   * @param degrees The flexion added, degrees.
   * @returns The posture leant.
   *
   * @evidenceExclude contracts/development/common.md#meaningful-documentation One joint's flexion added.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation One sum.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leant(posture: IHumanPosture, degrees: number): IHumanPosture {
    const spine: readonly [number, number, number] = posture.joints.spine ?? [
      0, 0, 0,
    ];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        spine: [spine[0] + degrees, spine[1], spine[2]],
      },
    };
  }

  /**
   * How far a seated rider leans the trunk forward to reach what the hands
   * hold: the least flexion of the spine, up to `LEAN`, that brings each
   * shoulder within `ARM` of its arm's length of its point, as a cyclist
   * leans to the bar.
   *
   * @param body The body.
   * @param seated The seated posture.
   * @param points What each hand holds, world metres, where the support stands with the rider seated so.
   * @returns Degrees of spine flexion to add; 0 when the arms reach as seated, `LEAN` when they do not even then.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved, its bound and both ends of the result.
   * @evidence contracts/development/implementation.md#principled-implementation Bisection on the flexion of the shortfall of the worse arm, read by forward kinematics of the leant posture; the shortfall falls as the trunk comes forward toward points ahead of it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shortfall at a lean, then the search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Points the arms do not reach at `LEAN` leave the hands short, which the contact audit reports; only the spine flexes, and the pelvis's roll forward a cyclist adds is not modelled.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most fourteen forward-kinematics passes, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lean(
    body: IHumanBody,
    seated: IHumanPosture,
    points: Partial<Record<"left" | "right", IAutoMovieVector3>>,
  ): number {
    const sides: ("left" | "right")[] = (["left", "right"] as const).filter(
      (side: "left" | "right"): boolean => points[side] !== undefined,
    );
    if (sides.length === 0) return 0;
    const short = (degrees: number): number => {
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, { ...leant(seated, degrees), limbs: {} }),
      );
      return Math.max(
        ...sides.map((side: "left" | "right"): number => {
          const shoulder: IAutoMovieVector3 = bones.get(
            `${side}UpperArm`,
          )!.worldPosition;
          const elbow: IAutoMovieVector3 = bones.get(
            `${side}LowerArm`,
          )!.worldPosition;
          const wrist: IAutoMovieVector3 = bones.get(
            `${side}Hand`,
          )!.worldPosition;
          return (
            Vector3.length(Vector3.subtract(points[side]!, shoulder)) -
            ARM *
              (Vector3.length(Vector3.subtract(elbow, shoulder)) +
                Vector3.length(Vector3.subtract(wrist, elbow)))
          );
        }),
      );
    };
    if (short(0) <= 0) return 0;
    if (short(LEAN) > 0) return LEAN;
    let low: number = 0;
    let high: number = LEAN;
    for (let i: number = 0; i < 12; ++i) {
      const middle: number = (low + high) / 2;
      if (short(middle) > 0) low = middle;
      else high = middle;
    }
    return high;
  }
}
