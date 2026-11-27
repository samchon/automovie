import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../../gait/internal/walk";
import { HumanSupportCarry } from "../../carrier/internal/HumanSupportCarry";
import { HumanHand } from "../../posture/internal/HumanHand";

/**
 * One step of a long insertion's stance along the bore's line: the walk law's
 * own plan from the stance it leaves to the one it reaches, the body keeping
 * its heading (`IAutoMovieMotionHumanWalkParams.facing`) and its arms to the
 * insertion. The entry is the act's own, carried to the stance left as
 * `HumanSupportStep` carries a walk onto its support's frame: its posture, pose
 * root and feet moved along the line, at rest; after an earlier step it stands
 * on the legs that step's walk ended on (`standing`), since a walk ends on its
 * own gait's stance, not on the entry's.
 *
 * @param context The operation's context.
 * @param toward The unit horizontal line the stance moves along.
 * @param from The stance left, metres along the line from the entry's.
 * @param to The stance reached, metres along the line from the entry's.
 * @param ended The posture the previous step's walk ended on; none for the
 *   first step.
 * @returns The walk's plan, from its own second 0.
 */
export function operateLongInsertStep(
  context: IAutoMovieMotionHumanActionContext<object>,
  toward: IAutoMovieVector3,
  from: number,
  to: number,
  ended?: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanActionPlan {
  const carry: IAutoMovieMotionHumanSupportCarry.ICarry =
    operateLongInsertStep.stance(toward, from);
  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  // Each foot where the previous walk put it down, else the entry's carried.
  const foot: (
    side: AutoMovieHumanSide,
  ) => IAutoMovieMotionHumanEntryState.IFoot = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanEntryState.IFoot => {
    const leg: IAutoMovieHumanLimbGoal | undefined = ended?.limbs[`${side}Leg`];
    return {
      ...entry.feet[side],
      ankle: leg?.point ?? carry.point(entry.feet[side].ankle),
      rotation: leg?.rotation ?? entry.feet[side].rotation,
    };
  };
  const moved: IAutoMovieMotionHumanEntryState = {
    ...entry,
    velocity: { ...entry.velocity, linear: { x: 0, y: 0, z: 0 } },
    posture: operateLongInsertStep.standing(entry.posture, toward, from, ended),
    pose:
      entry.pose.root === undefined || entry.pose.root === null
        ? entry.pose
        : {
            ...entry.pose,
            root: {
              ...entry.pose.root,
              translation: carry.point(entry.pose.root.translation),
            },
          },
    feet: { left: foot("left"), right: foot("right") },
  };
  const root: IAutoMovieVector3 = operateLongInsertStep
    .stance(toward, to)
    .point(entry.posture.root);
  const floor: number =
    Math.min(moved.feet.left.ankle.y, moved.feet.right.ankle.y) -
    context.body.measure.ankleHeight;
  const params: IAutoMovieMotionHumanWalkParams = {
    to: { x: root.x, y: floor, z: root.z },
    face: entry.posture.yaw,
    facing: { yaw: entry.posture.yaw },
    armSwing: 0,
  };
  return walk.plan({ ...context, params, entry: moved });
}

/** The stance carry of {@link operateLongInsertStep}. */
export namespace operateLongInsertStep {
  /**
   * The translation that carries the entry's stance a distance along the line.
   *
   * @param toward The unit horizontal line.
   * @param x Metres along it.
   * @returns The carry.
   */
  export function stance(
    toward: IAutoMovieVector3,
    x: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry {
    return {
      point: (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(p, Vector3.scale(toward, x)),
      turn: { x: 0, y: 0, z: 0, w: 1 },
      yaw: 0,
    };
  }

  /**
   * The entry's posture carried to a stance, standing on the legs a step's walk
   * ended on: its root, its leg goals and the hips' and toes' joints, since a
   * walk ends on its own gait's stance; the arms and the trunk stay the
   * entry's, carried.
   *
   * @param posture The entry's posture.
   * @param toward The unit horizontal line.
   * @param x Metres along it.
   * @param ended The posture the last walk ended on; the carried entry alone
   *   when absent.
   * @returns The standing posture.
   */
  export function standing(
    posture: IAutoMovieMotionHumanPosture,
    toward: IAutoMovieVector3,
    x: number,
    ended?: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const carried: IAutoMovieMotionHumanPosture = HumanSupportCarry.posture(
      stance(toward, x),
      posture,
    );
    if (ended === undefined) return carried;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...carried.limbs };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...carried.joints,
    };
    for (const side of ["left", "right"] as const) {
      const leg: IAutoMovieHumanLimbGoal | undefined =
        ended.limbs[`${side}Leg`];
      if (leg !== undefined) limbs[`${side}Leg`] = leg;
      const toes: readonly [number, number, number] | undefined =
        ended.joints[`${side}Toes`];
      if (toes !== undefined) joints[`${side}Toes`] = toes;
    }
    if (ended.joints.hips !== undefined) joints.hips = ended.joints.hips;
    return { ...carried, root: ended.root, limbs, joints };
  }

  /**
   * The finger joints a posture holds in both hands, for a walk spliced into an
   * act whose hands keep their grips: the walk shapes its hands relaxed.
   *
   * @param posture The posture whose fingers are kept.
   * @returns Its finger and thumb joints.
   */
  export function grips(
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const joints: Record<
      string,
      IAutoMovieMotionHumanPosture["joints"]["hips"]
    > = {};
    const heldJoints: Readonly<typeof joints> = posture.joints;
    for (const hand of HumanHand.SIDES)
      for (const bone of Object.keys(HumanHand.shape(hand, "relaxed"))) {
        const held: readonly [number, number, number] | undefined =
          heldJoints[bone];
        if (held !== undefined) joints[bone] = held;
      }
    return joints;
  }
}
