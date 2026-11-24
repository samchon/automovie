import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanDigitGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanDigitFit } from "../posture/HumanDigitFit";
import { HumanPosture } from "../posture/HumanPosture";

/**
 * A planned arm's hand fingers as the plan carries them: one finger state, in
 * joint space, that the planner reads the hand by and the display plays
 * unchanged, MoveIt's grasp convention (`moveit_msgs/Grasp`,
 * ros-planning/moveit_msgs, BSD-3-Clause: a grasp's `grasp_pose` with its
 * `grasp_posture`, the finger joints the plan carries for execution to play).
 * No digit is fitted after the plan, so the fingers the audit reads are the
 * ones the planner kept clear.
 *
 * At each instant the planner reads, a hand whose posture gives its digits
 * goals takes them fitted (`HumanDigitFit.fitted`) with its arm at its goal's
 * own fit there, the grasp pose that grasp posture belongs to; a hand with no
 * digit goal keeps the digits its base pose has. Between those instants the
 * state is played linearly in each joint, as joint_trajectory_controller
 * (ros-controls/ros_controllers, BSD-3-Clause) plays a trajectory whose points
 * give positions alone.
 */
export namespace AutoMovieMotionHumanArmPlayed {
  /**
   * A hand's finger state at one instant of the plan, in joint space.
   *
   * @param body The body.
   * @param pose The instant's base pose, the planned arms left out.
   * @param posture The instant's posture so far, whose digit goals for this
   *   hand the state fits.
   * @param side The hand.
   * @param arm The arm at its goal's fit there, read only when the hand has a
   *   digit goal.
   * @returns The hand's digit joints, clinical degrees, by bone.
   */
  export function grasp(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    arm: () => IAutoMovieMotionHumanArmAngles.IAngles,
  ): Fingers {
    const goals: Goals | undefined = own(posture.digits, side);
    if (goals === undefined) return of(pose, side);
    return of(
      HumanDigitFit.fitted(body, armed(pose, side, arm()), goals),
      side,
    );
  }

  /**
   * The finger state played over the plan's instants: linear in each joint
   * between neighbouring instants, held at the first before them and at the
   * last after them.
   *
   * @param times The instants, seconds, ascending.
   * @param states The finger state at each instant.
   * @returns The state at a second.
   */
  export function prepare(
    times: readonly number[],
    states: readonly Fingers[],
  ): (seconds: number) => Fingers {
    const n: number = times.length;
    return (seconds: number): Fingers => {
      if (n === 0) return {};
      if (seconds <= times[0]!) return { ...states[0]! };
      if (seconds >= times[n - 1]!) return { ...states[n - 1]! };

      // The interval holding the second, by bisection.
      let lo: number = 0;
      let hi: number = n - 1;
      while (hi - lo > 1) {
        const mid: number = (lo + hi) >> 1;
        if (times[mid]! <= seconds) lo = mid;
        else hi = mid;
      }
      const s: number = (seconds - times[lo]!) / (times[hi]! - times[lo]!);
      const a: Fingers = states[lo]!;
      const b: Fingers = states[hi]!;
      const out: Fingers = {};
      for (const bone of new Set<AutoMovieHumanoidBone>([
        ...(Object.keys(a) as AutoMovieHumanoidBone[]),
        ...(Object.keys(b) as AutoMovieHumanoidBone[]),
      ])) {
        const from: Angles = a[bone] ?? b[bone]!;
        const to: Angles = b[bone] ?? from;
        out[bone] = [
          from[0] + (to[0] - from[0]) * s,
          from[1] + (to[1] - from[1]) * s,
          from[2] + (to[2] - from[2]) * s,
        ];
      }
      return out;
    };
  }

  /**
   * A posture with a planned arm written as joints and its hand's fingers as
   * the plan plays them; the arm's limb goal and the hand's digit goals are
   * removed, so no fit after the plan moves either.
   *
   * @param posture The posture before the arm.
   * @param side The arm.
   * @param arm The arm's joints.
   * @param digits The hand's finger state.
   * @returns The posture.
   */
  export function written(
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    digits: Fingers,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
      ...digits,
    };
    joints[`${side}UpperArm`] = arm.upper;
    joints[`${side}LowerArm`] = arm.lower;
    joints[`${side}Hand`] = arm.hand;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const out: IAutoMovieMotionHumanPosture = { ...posture, joints, limbs };
    if (own(posture.digits, side) === undefined) return out;
    const goals: Goals = { ...posture.digits };
    for (const digit of HumanPosture.DIGITS)
      if (digit.startsWith(side)) delete goals[digit];
    if (Object.keys(goals).length === 0) delete out.digits;
    else out.digits = goals;
    return out;
  }
}

/** A hand's digit joints, clinical degrees, by bone. */
type Fingers = IAutoMovieMotionHumanPosture["joints"];

/** A posture's digit goals. */
type Goals = NonNullable<IAutoMovieMotionHumanPosture["digits"]>;

/** A joint's clinical flexion, abduction and twist, degrees. */
type Angles = readonly [number, number, number];

/** The fingers of a hand. */
const FINGERS: readonly string[] = [
  "Thumb",
  "Index",
  "Middle",
  "Ring",
  "Little",
];

/** A hand's own digit goals among a posture's, or none where it has none. */
function own(
  digits: IAutoMovieMotionHumanPosture["digits"],
  side: AutoMovieHumanSide,
): Goals | undefined {
  if (digits === undefined) return undefined;
  const out: Goals = {};
  for (const digit of HumanPosture.DIGITS) {
    const goal: IAutoMovieHumanDigitGoal | undefined = digits[digit];
    if (goal !== undefined && digit.startsWith(side)) out[digit] = goal;
  }
  return Object.keys(out).length === 0 ? undefined : out;
}

/**
 * A hand's digit joints as a pose has them, by bone; a digit the pose sets no
 * joint for is absent.
 */
function of(pose: IAutoMoviePose, side: AutoMovieHumanSide): Fingers {
  const wanted: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    FINGERS.flatMap((name: string): AutoMovieHumanoidBone[] =>
      HumanDigitFit.bones(side, name),
    ),
  );
  const out: Fingers = {};
  for (const joint of pose.joints)
    if (wanted.has(joint.bone))
      out[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
  return out;
}

/**
 * A pose with one arm's joints at given clinical angles, every other joint as
 * it was; an arm joint the pose lacks is added.
 */
function armed(
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
  arm: IAutoMovieMotionHumanArmAngles.IAngles,
): IAutoMoviePose {
  const set: ReadonlyMap<AutoMovieHumanoidBone, Angles> = new Map<
    AutoMovieHumanoidBone,
    Angles
  >([
    [`${side}UpperArm`, arm.upper],
    [`${side}LowerArm`, arm.lower],
    [`${side}Hand`, arm.hand],
  ]);
  const seen: Set<AutoMovieHumanoidBone> = new Set();
  const joints: IAutoMovieJointPose[] = pose.joints.map(
    (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
      const angles: Angles | undefined = set.get(joint.bone);
      if (angles === undefined) return joint;
      seen.add(joint.bone);
      return {
        ...joint,
        flexion: angles[0],
        abduction: angles[1],
        twist: angles[2],
      };
    },
  );
  for (const [bone, angles] of set)
    if (!seen.has(bone))
      joints.push({
        bone,
        flexion: angles[0],
        abduction: angles[1],
        twist: angles[2],
      });
  return { ...pose, joints };
}
