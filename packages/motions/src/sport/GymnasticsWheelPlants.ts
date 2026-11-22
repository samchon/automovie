import {
  Quaternion,
  Vector3,
  hingedArmSwivel,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanElbowPole } from "../compose/AutoMovieMotionHumanElbowPole";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHandShape } from "../posture/HumanHandShape";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsPalmRise } from "./GymnasticsPalmRise";

/**
 * The bearing limbs of a wheel (`GymnasticsWheel`): a rigid turn carries the
 * hands and feet with the shape, so a joint that bears would turn about
 * itself and its sole or palm would lift, skate or pass into the floor. While
 * a spoke bears, its limb is solved to a laid place fixed where it came
 * down: a foot flat on its ankle's point at its own heading, a palm flat on
 * the floor under its wrist with the fingers straight. The hands are set in
 * the T-shape gymnasts are coached to and that loads the wrists and elbows
 * least (Farana, Irwin, Jandacka, Uchytil and Mullineaux 2014, Sports
 * Biomechanics 13(2):123-134; Farana et al. 2018, European Journal of Sport
 * Science 18(10):1375-1381): the first hand's fingers point along the travel,
 * the second's turned a quarter, toward the way the body faced, so neither
 * forearm stands at the end of its turn.
 *
 * Over `LEAD` of the action at each end the limb moves from the carried pose
 * to the laid one and back, blended in joint space as a skeletal control's
 * weight blends its solved chain with the input pose (each joint on its
 * rotation, `blendHumanJoint`): the solve of the laid place is the end at
 * full weight and the carried joints the end at none, so a contact taken or
 * left mid-turn neither jumps nor makes the solver choose a turn of the arm
 * the carried pose does not have. A laid arm's elbow keeps the carried one's
 * side, a straight arm's pushed out along its olecranon
 * (`AutoMovieMotionHumanElbowPole`), so the solve has a side to bend to.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the limbs are laid, where, how the hands are turned and how the ends blend, with the sources.
 * @evidence contracts/development/design.md#principled-representation Limb goals over a rigid wheel posture, one per bearing window, and joint-space blends at their ends.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The blend share, the finger directions and one writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The places are where the wheel set each joint down; nothing is typed in.
 */
export namespace GymnasticsWheelPlants {
  /** The share of the action over which a limb takes its laid place before its contact and leaves it after, provisional. */
  export const LEAD: number = 0.06;

  /**
   * The directions the laid fingers point along the floor, unit vectors.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The T-shape's two hands in their order of contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts World directions given by the law.
   */
  export interface IFingers {
    /** The first hand down: along the travel. */
    first: IAutoMovieVector3;

    /** The second hand down: a quarter turn from the first, toward the way the body faced. */
    second: IAutoMovieVector3;
  }

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

    /** The laid fingers' direction, for a hand. */
    fingers: IAutoMovieVector3;

    /** The laid limb goal, given the posture it is written into. */
    goal(posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal;
  }

  /** A window's weight at a second. */
  interface IWeighted {
    /** The window. */
    laid: ILaid;

    /** Its weight, in (0, 1]. */
    weight: number;
  }

  /**
   * The writer of a wheel's bearing limbs.
   *
   * @param body The body.
   * @param contacts The wheel's bearing windows, shares of the duration.
   * @param duration The action's seconds.
   * @param carried The wheel's rigid posture at an action second.
   * @param fingers The laid fingers' directions on the floor, by the hands' order of contact.
   * @returns A writer of the laid limbs into a carried posture at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the writer.
   * @evidence contracts/development/implementation.md#principled-implementation Each window's laid goal from the carried pose where it came down; at the ends a minimum-jerk weight blends the carried joints toward the laid solve's joints on each joint's rotation (`blendHumanJoint`), the input-pose blend of a skeletal control's weight, so zero weight is the carried pose itself.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Windows, then per limb the heaviest window, then one write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The laid place is the wheel's own contact point; the fingers are the flat hand's (`HumanHandShape`).
   * @evidence contracts/development/implementation.md#efficient-algorithms One bone FK per window at its start; per written sample, one FK of the limb and, for an arm, one of its hand under a flexed elbow; a blended sample adds one solve of that limb.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The leg goal, the hand target, the hand shape, the joint blend and the pose reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the windows' places.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    contacts: readonly IAutoMovieMotionHumanContactWindow[],
    duration: number,
    carried: (seconds: number) => IAutoMovieMotionHumanPosture,
    fingers: IFingers,
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
    const firstHand: number = contacts.findIndex(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === "leftHand" || c.part === "rightHand",
    );
    const laid: ILaid[] = contacts.flatMap(
        (c: IAutoMovieMotionHumanContactWindow, index: number): ILaid[] => {
          if (
            c.part !== "leftFoot" &&
            c.part !== "rightFoot" &&
            c.part !== "leftHand" &&
            c.part !== "rightHand"
          )
            return [];
          const bone: AutoMovieHumanoidBone = c.part;
          const side: AutoMovieHumanSide = c.part.startsWith("left")
            ? "left"
            : "right";
          const hand: boolean = c.part.endsWith("Hand");
          const from: number = c.from * duration;
          const down: IAutoMovieResolvedBone = end(carried(from), bone);
          const along: IAutoMovieVector3 =
            index === firstHand ? fingers.first : fingers.second;
          const window: Omit<ILaid, "goal"> = {
            bone,
            side,
            hand,
            from,
            to: c.to * duration,
            opens: c.from <= 0,
            closes: c.to >= 1,
            fingers: along,
          };
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
            return [
              {
                ...window,
                goal: (
                  posture: IAutoMovieMotionHumanPosture,
                ): IAutoMovieHumanLimbGoal =>
                  target(posture, { point, normal: { x: 0, y: 1, z: 0 } }, along),
              },
            ];
          }
          const place: IAutoMovieMotionHumanFoot.IPlacement = {
            ankle: down.worldPosition,
            rotation: HumanFoot.rotation(
              HumanFoot.heading(down.worldRotation),
              0,
            ),
          };
          return [
            {
              ...window,
              goal: (
                posture: IAutoMovieMotionHumanPosture,
              ): IAutoMovieHumanLimbGoal =>
                AutoMovieMotionHumanLeg.goal(body, posture, side, place, true),
            },
          ];
        },
      );
    const flat: Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]> =
      {
        left: HumanHandShape.of("left", "flat"),
        right: HumanHandShape.of("right", "flat"),
      };
    const lead: number = Math.max(1e-9, LEAD * duration);

    // A window's weight: 1 while it bears, eased in over the lead before it
    // and out over the lead after, 0 elsewhere.
    const weight = (l: ILaid, seconds: number): number => {
      const before: number = l.opens ? -Infinity : l.from - lead;
      const after: number = l.closes ? Infinity : l.to + lead;
      if (seconds <= before || seconds >= after) return 0;
      if (seconds < l.from) return minimumJerk.share((seconds - before) / lead);
      if (seconds > l.to) return 1 - minimumJerk.share((seconds - l.to) / lead);
      return 1;
    };
    return (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      // Each limb follows its heaviest window: two windows of one limb meet
      // only where one eases out as the other eases in.
      const heaviest: Map<AutoMovieHumanoidBone, IWeighted> = new Map();
      for (const l of laid) {
        const w: number = weight(l, seconds);
        if (!(w > 0)) continue;
        const kept: IWeighted | undefined = heaviest.get(l.bone);
        if (kept === undefined || w > kept.weight)
          heaviest.set(l.bone, { laid: l, weight: w });
      }
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
      };
      for (const { laid: l, weight: w } of heaviest.values()) {
        const key: AutoMovieHumanLimb = l.hand
          ? l.side === "left"
            ? "leftArm"
            : "rightArm"
          : l.side === "left"
            ? "leftLeg"
            : "rightLeg";
        const middle: AutoMovieHumanoidBone = l.hand
          ? `${l.side}LowerArm`
          : `${l.side}LowerLeg`;
        // The elbow or the knee kept where the carried shape holds it, so the
        // laid limb takes the same branch as the carried one. A straight
        // arm's elbow lies on the line from the shoulder to the hand and
        // names no side, so its pole is pushed out along the olecranon: the
        // way the elbow goes as the arm bends, opposite to where an elbow
        // flexion carries the hand.
        const free: IAutoMovieMotionHumanPosture = { ...posture, limbs: {} };
        const shown: IAutoMoviePose = resolveHumanPosture(body, free);
        const carriedBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          poseBones(
            body,
            shown,
            undefined,
            new Set<AutoMovieHumanoidBone>([
              l.bone,
              middle,
              ...(l.hand
                ? ([
                    l.side === "left" ? "leftUpperArm" : "rightUpperArm",
                    l.side === "left"
                      ? "leftMiddleProximal"
                      : "rightMiddleProximal",
                  ] as const)
                : []),
            ]),
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
        // A palm whose wrist cannot extend so far rises about its knuckles;
        // the laid fingers are straight, extended at the knuckles by the rise.
        const risen: GymnasticsPalmRise.IRise = l.hand
          ? GymnasticsPalmRise.of(
              l.side,
              { ...l.goal(posture), bend },
              carriedBones.get(
                l.side === "left" ? "leftUpperArm" : "rightUpperArm",
              )!.worldPosition,
              GymnasticsPalmRise.knuckle(
                carriedEnd,
                carriedBones.get(
                  l.side === "left"
                    ? "leftMiddleProximal"
                    : "rightMiddleProximal",
                )!,
              ),
              l.fingers,
            )
          : { goal: { ...l.goal(posture), bend }, joints: {} };
        // A laid foot stays the leg's goal, held by the planted leg's own fit
        // (its contact re-aim and heel rocker), eased from the carried foot
        // over the lead.
        if (!l.hand) {
          limbs[key] =
            w >= 1
              ? risen.goal
              : {
                  ...risen.goal,
                  point: Vector3.lerp(
                    carriedEnd.worldPosition,
                    risen.goal.point,
                    w,
                  ),
                  ...(risen.goal.rotation === undefined
                    ? {}
                    : {
                        rotation: Quaternion.slerp(
                          carriedEnd.worldRotation,
                          risen.goal.rotation,
                          w,
                        ),
                      }),
                };
          continue;
        }
        const digits: IAutoMovieMotionHumanPosture["joints"] = {
          ...flat[l.side],
          ...risen.joints,
        };
        // The laid limb solved at the carried limb's own swivel and branch
        // (`HumanLimbFit.seed` of the shown pose, prescribed), so the solve
        // keeps the elbow's or the knee's side and the forearm's turn the
        // carried limb has and follows it continuously as the body turns.
        const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
          body,
          shown,
          key,
        );
        const solved: IAutoMoviePose = resolveHumanPosture.seeded(
          body,
          {
            ...posture,
            joints: { ...posture.joints, ...digits },
            limbs: { [key]: risen.goal },
          },
          undefined,
          seed === null
            ? {}
            : {
                [key]: {
                  ...seed,
                  tolerance: hingedArmSwivel.RESOLUTION,
                  prescribed: true,
                },
              },
        ).pose;
        // The limb is written as joints, the solve's at full weight and, at
        // the ends, each joint on its rotation from the shown angle toward
        // the solve's: the law owns the laid limb, so no later fit of the
        // goal chooses another turn of it.
        const before: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> =
          angles(shown);
        for (const [bone, at] of angles(solved)) {
          const was: IAutoMovieJointPose | undefined = before.get(bone);
          const to: readonly [number, number, number] = [
            at.flexion ?? 0,
            at.abduction ?? 0,
            at.twist ?? 0,
          ];
          const from: readonly [number, number, number] = [
            was?.flexion ?? 0,
            was?.abduction ?? 0,
            was?.twist ?? 0,
          ];
          if (
            Math.abs(to[0] - from[0]) +
              Math.abs(to[1] - from[1]) +
              Math.abs(to[2] - from[2]) <=
            1e-9
          )
            continue;
          joints[bone] = w >= 1 ? to : blendHumanJoint(body, bone, from, to, w);
        }
        delete limbs[key];
      }
      return { ...posture, joints, limbs };
    };
  }
}

/** A pose's joints by bone. */
function angles(
  pose: IAutoMoviePose,
): Map<AutoMovieHumanoidBone, IAutoMovieJointPose> {
  return new Map(
    pose.joints.map(
      (j: IAutoMovieJointPose): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [
        j.bone,
        j,
      ],
    ),
  );
}
