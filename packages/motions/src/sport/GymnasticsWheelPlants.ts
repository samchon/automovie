import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanElbowPole } from "../compose/AutoMovieMotionHumanElbowPole";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The bearing limbs of a wheel (`GymnasticsWheel`): a rigid turn carries the
 * hands and feet with the shape, so a joint that bears would turn about
 * itself and its sole or palm would lift, skate or pass into the floor. While
 * a spoke bears, its limb is solved to a laid place fixed where it came
 * down: a foot flat on its ankle's point at its own heading, a palm flat on
 * the floor under its wrist, the fingers along the wheel's travel. Over
 * `LEAD` of the action at each end the limb moves from the carried pose to
 * the laid one and back, so a contact taken or left mid-turn does not jump;
 * a hand the carried shape would take below the floor is held on it. A laid
 * arm's elbow keeps the carried one's side, a straight arm's pushed out
 * along its olecranon (`AutoMovieMotionHumanElbowPole`), so the solve has a
 * side to bend to.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the limbs are laid, where and how the ends blend.
 * @evidence contracts/development/design.md#principled-representation Limb goals over a rigid wheel posture, one per bearing window.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The blend share and one writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The places are where the wheel set each joint down; nothing is typed in.
 */
export namespace GymnasticsWheelPlants {
  /** The share of the action over which a limb takes its laid place before its contact and leaves it after, provisional. */
  export const LEAD: number = 0.06;

  /** One bearing window with its laid place. */
  interface ILaid {
    /** The bearing bone. */
    bone: AutoMovieHumanoidBone;

    /** Its side. */
    side: AutoMovieHumanSide;

    /** Whether a hand. */
    hand: boolean;

    /** The window's first and last action seconds. */
    from: number;
    to: number;

    /** Whether it begins with the action or ends with it, so takes no blend there. */
    opens: boolean;
    closes: boolean;

    /** The laid limb goal, given the posture it is written into. */
    goal(posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal;
  }

  /**
   * The writer of a wheel's bearing limbs.
   *
   * @param body The body.
   * @param contacts The wheel's bearing windows, shares of the duration.
   * @param duration The action's seconds.
   * @param carried The wheel's rigid posture at an action second.
   * @param forward The wheel's travel on the floor, a unit vector: the laid fingers' direction.
   * @returns A writer of the laid limbs into a carried posture at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the writer.
   * @evidence contracts/development/implementation.md#principled-implementation Each window's laid goal from the carried pose where it came down; a minimum-jerk-free linear blend of point and slerp of rotation between the carried and the laid limb at the ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Windows, then one write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The laid place is the wheel's own contact point.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bone FK per window at its start; per written sample, one FK of the limb and, for an arm, one of its hand under a flexed elbow.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The leg goal, the hand target and the pose reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the windows' places.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    contacts: readonly IAutoMovieMotionHumanContactWindow[],
    duration: number,
    carried: (seconds: number) => IAutoMovieMotionHumanPosture,
    forward: IAutoMovieVector3,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture {
    const end: (
      posture: IAutoMovieMotionHumanPosture,
      bone: AutoMovieHumanoidBone,
    ) => IAutoMovieResolvedBone = (
      posture: IAutoMovieMotionHumanPosture,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieResolvedBone =>
      poseBones(
        body,
        resolveHumanPosture(body, { ...posture, limbs: {} }),
        undefined,
        new Set([bone]),
      ).get(bone)!;
    const laid: ILaid[] = contacts
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === "leftFoot" ||
          c.part === "rightFoot" ||
          c.part === "leftHand" ||
          c.part === "rightHand",
      )
      .map((c: IAutoMovieMotionHumanContactWindow): ILaid => {
        const bone: AutoMovieHumanoidBone = c.part as AutoMovieHumanoidBone;
        const side: AutoMovieHumanSide = c.part.startsWith("left")
          ? "left"
          : "right";
        const hand: boolean = c.part.endsWith("Hand");
        const from: number = c.from * duration;
        const down: IAutoMovieResolvedBone = end(carried(from), bone);
        if (hand) {
          const target: ReturnType<typeof HumanHandTarget.prepareGoal> =
            HumanHandTarget.prepareGoal(body, side, {
              surface: "palm",
              shape: "flat",
            });
          const point: IAutoMovieVector3 = {
            x: down.worldPosition.x,
            y: 0,
            z: down.worldPosition.z,
          };
          return {
            bone,
            side,
            hand,
            from,
            to: c.to * duration,
            opens: c.from <= 0,
            closes: c.to >= 1,
            goal: (
              posture: IAutoMovieMotionHumanPosture,
            ): IAutoMovieHumanLimbGoal =>
              target(posture, { point, normal: { x: 0, y: 1, z: 0 } }, forward),
          };
        }
        const place: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: down.worldPosition,
          rotation: HumanFoot.rotation(
            HumanFoot.heading(down.worldRotation),
            0,
          ),
        };
        return {
          bone,
          side,
          hand,
          from,
          to: c.to * duration,
          opens: c.from <= 0,
          closes: c.to >= 1,
          goal: (
            posture: IAutoMovieMotionHumanPosture,
          ): IAutoMovieHumanLimbGoal =>
            AutoMovieMotionHumanLeg.goal(body, posture, side, place, true),
        };
      });
    return (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const l of laid) {
        // The limb reaches its laid place by the contact and leaves it after
        // the lift, over a lead before and after the window, so it is laid
        // whenever it bears and is never laid only partly while it bears.
        const lead: number = Math.max(1e-9, LEAD * duration);
        const before: number = l.opens ? -Infinity : l.from - lead;
        const after: number = l.closes ? Infinity : l.to + lead;
        // A limb is written near its contact; a hand also wherever the carried
        // shape would take it below the floor.
        const outside: boolean = seconds < before || seconds > after;
        if (outside && !l.hand) continue;
        if (
          outside &&
          laid.some(
            (o: ILaid): boolean =>
              o !== l &&
              o.bone === l.bone &&
              seconds >= o.from - lead &&
              seconds <= o.to + lead,
          )
        )
          continue;
        const w: number = outside
          ? 0
          : seconds < l.from
            ? minimumJerk.share((seconds - before) / lead)
            : seconds > l.to
              ? 1 - minimumJerk.share((seconds - l.to) / lead)
              : 1;
        const key: AutoMovieHumanLimb = l.hand
          ? l.side === "left"
            ? "leftArm"
            : "rightArm"
          : l.side === "left"
            ? "leftLeg"
            : "rightLeg";
        // The elbow or the knee kept where the carried shape holds it, so the
        // laid limb takes the same branch as the carried one. A straight
        // arm's elbow lies on the line from the shoulder to the hand and
        // names no side, so its pole is pushed out along the olecranon: the
        // way the elbow goes as the arm bends, opposite to where an elbow
        // flexion carries the hand.
        const middle: AutoMovieHumanoidBone = l.hand
          ? l.side === "left"
            ? "leftLowerArm"
            : "rightLowerArm"
          : l.side === "left"
            ? "leftLowerLeg"
            : "rightLowerLeg";
        const free: IAutoMovieMotionHumanPosture = { ...posture, limbs: {} };
        const carriedBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          poseBones(
            body,
            resolveHumanPosture(body, free),
            undefined,
            new Set<AutoMovieHumanoidBone>([l.bone, middle]),
          );
        const carriedEnd: IAutoMovieResolvedBone = carriedBones.get(l.bone)!;
        const elbow: IAutoMovieVector3 =
          carriedBones.get(middle)!.worldPosition;
        const bend: IAutoMovieVector3 = l.hand
          ? AutoMovieMotionHumanElbowPole.of(
              body,
              free,
              middle,
              l.bone,
              carriedEnd.worldPosition,
              elbow,
            )
          : elbow;
        const goal: IAutoMovieHumanLimbGoal = { ...l.goal(posture), bend };
        if (w >= 1) {
          limbs[key] = goal;
          continue;
        }
        // Away from its contact a hand follows the carried shape, but never
        // below the floor it was laid on: there it is held on the floor.
        const low: boolean =
          l.hand && carriedEnd.worldPosition.y < goal.point.y;
        if (outside && !low) continue;
        const toward: IAutoMovieHumanLimbGoal = low
          ? {
              ...goal,
              point: { ...carriedEnd.worldPosition, y: goal.point.y },
            }
          : {
              ...goal,
              point: carriedEnd.worldPosition,
              rotation: carriedEnd.worldRotation,
            };
        limbs[key] = {
          ...goal,
          point: Vector3.lerp(toward.point, goal.point, w),
          ...(goal.rotation === undefined || toward.rotation === undefined
            ? {}
            : {
                rotation: Quaternion.slerp(toward.rotation, goal.rotation, w),
              }),
        };
      }
      return { ...posture, limbs };
    };
  }
}
