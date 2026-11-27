import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearing } from "./HumanArmClearing";
import { HumanArmObstacleBones } from "./HumanArmObstacleBones";
import { HumanArmOvershoot } from "./HumanArmOvershoot";
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";
import { prepareHumanJointRom } from "./prepareHumanJointRom";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/*
 * The room a forearm needs beside its own trunk and beside the other arm.
 *
 * The other arm's room is the far side of the chest's median plane: an elbow
 * crosses it only as far as its wrist's goal does.
 *
 * A hand goal fixes the wrist and leaves the elbow free on a circle. An elbow
 * place whose point is outside the trunk can still run the forearm through it,
 * so the forearm is judged along its whole length: its axis, sampled from the
 * elbow toward the wrist, keeps the forearm's radius from the colliders of the
 * trunk, the neck and the head at the elbow, tapering to the wrist's own
 * clearance at the wrist, where the palm lies on the surface the hand was sent
 * to. The limb fit, which places the legs before the arms, judges the whole
 * legs too (`obstacles`); a caller that poses only the trunk judges the trunk
 * alone (`trunk`).
 *
 * An arm that is not fitted to a goal but carried in joint space between two
 * arms has no elbow place to choose and no goal under its wrist; it is read
 * whole (`room`), against another body's colliders too when one stands in its
 * way, and its elbow let out or folded until the forearm asks no more room than
 * the carry's two ends hold (`cleared`).
 */
export namespace HumanArmClearance {
  /*
   * The colliders a forearm may not enter, placed by a pose's bones.
   * Parameter body: The body.
   * Parameter bones: Its posed bones, world frame; only the trunk's are read.
   * Returns: The placed segments of the hips, the spine, the chest, the neck
   * and the head.
   */
  export function trunk(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    return HumanColliders.placed(body, bones).filter(
      (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
        HumanArmObstacleBones.TRUNK.has(segment.bone),
    );
  }

  /*
   * The colliders a forearm may not enter in a pose whose legs are placed: the
   * trunk's, both whole legs' and those of any arm already placed, the segments
   * the tangle audit reads the arm against.
   * Parameter body: The body.
   * Parameter bones: Its posed bones, world frame, the legs where the pose puts
   * them.
   * Parameter arms: The arms already placed whose upper arm, forearm and hand
   * count; none when absent.
   * Parameter placed: An existing placement of this exact body and bone reading in
   * the same unchanged synchronous evaluation; computed here when absent.
   * Returns: The placed segments of `trunk`, of the two legs and of the named
   * arms.
   */
  export function obstacles(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    arms: readonly AutoMovieHumanSide[] = [],
    placed?: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    const limbs: ReadonlySet<AutoMovieHumanoidBone> =
      HumanArmObstacleBones(arms);
    return (placed ?? HumanColliders.placed(body, bones)).filter(
      (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
        limbs.has(segment.bone),
    );
  }

  /*
   * How far a forearm lies inside the room it needs, as degrees of upper arm
   * turn (`HumanArmOvershoot.of`, which states the rule).
   * Parameter body: The body, for the forearm's radius and the upper arm's length.
   * Parameter shapes: The trunk's placed colliders (`trunk`).
   * Parameter elbow: The elbow, world metres.
   * Parameter wrist: The wrist, world metres.
   * Parameter side: The arm.
   * Parameter others: Placed colliders the wrist has no goal on (another body's);
   * none when absent.
   * Parameter goal: Whether the wrist is where a goal put it, which excuses its own
   * depth in `shapes`; a carried arm between its ends has none.
   * Parameter rival: The world point the other arm's goal will put its wrist at,
   * while that arm is still to be fitted; absent, the room is kept unless the
   * other arm's colliders are among `shapes`.
   * Parameter hint: The world point the goal hints the elbow toward; none when
   * absent.
   * Parameter rests: Placed colliders of another body the goal lays the hand on;
   * none when absent.
   * Returns: Degrees; 0 when the forearm clears every shape and the elbow keeps
   * its side.
   */
  export function overshoot(
    body: IAutoMovieMotionHumanBody,
    shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    elbow: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    goal: boolean = true,
    rival?: IAutoMovieVector3,
    hint?: IAutoMovieVector3,
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
  ): number {
    return HumanArmOvershoot(
      body,
      shapes,
      elbow,
      wrist,
      side,
      others,
      goal,
      rival,
      hint,
      rests,
    );
  }

  /*
   * A pose with one arm's three joints replaced.
   * Parameter pose: The pose.
   * Parameter side: The arm.
   * Parameter arm: The arm's joint angles.
   * Returns: The pose, every other joint as it was.
   */
  export function posed(
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
  ): IAutoMoviePose {
    const written: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {
      [`${side}UpperArm`]: arm.upper,
      [`${side}LowerArm`]: arm.lower,
      [`${side}Hand`]: arm.hand,
    };
    return {
      ...pose,
      joints: pose.joints.map(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
          const angles: readonly [number, number, number] | undefined =
            written[joint.bone];
          return angles === undefined
            ? joint
            : {
                ...joint,
                flexion: angles[0],
                abduction: angles[1],
                twist: angles[2],
              };
        },
      ),
    };
  }

  /*
   * The bones of the five digits, by their names.
   */
  export const DIGITS: RegExp = /(Thumb|Index|Middle|Ring|Little)/;

  /*
   * A pose with one hand's fingers written at given angles, so an arm's room
   * reads the fingers it is shown with: the ones the hand holds at that
   * instant, or those it held where the arm was read.
   * Parameter pose: The pose.
   * Parameter side: The hand.
   * Parameter fingers: Clinical triples by bone; the other hand's and every other
   * bone's are ignored.
   * Returns: The pose, every other joint as it was.
   */
  export function fingered(
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    fingers: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >,
  ): IAutoMoviePose {
    return {
      ...pose,
      joints: pose.joints.map(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
          const angles: readonly [number, number, number] | undefined =
            joint.bone.startsWith(side) && DIGITS.test(joint.bone)
              ? fingers[joint.bone]
              : undefined;
          return angles === undefined
            ? joint
            : {
                ...joint,
                flexion: angles[0],
                abduction: angles[1],
                twist: angles[2],
              };
        },
      ),
    };
  }

  /*
   * A forearm's overshoot (`overshoot`) with the arm at given joint angles in a
   * pose.
   * Parameter body: The body.
   * Parameter pose: The pose; the trunk, the legs and the other arm are read where
   * it puts them.
   * Parameter side: The arm.
   * Parameter arm: The arm's joint angles, which replace the pose's.
   * Parameter others: Another body's placed colliders in the arm's way; none when
   * absent.
   * Parameter baseline: What each of the two readings may keep, degrees
   * (`IBaseline`); none when absent.
   * Parameter prepared: An actual FK reader borrowed only through this synchronous
   * unchanged-rig search; every pose still receives full admission and fresh
   * resolved bones.
   * Returns: Degrees; 0 when the forearm clears the trunk, the thighs, the
   * other arm and the others, and no segment of the arm lies deeper in the
   * body than at rest or in the quiet stance, each beyond its baseline.
   */
  export function room(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    baseline: IAutoMovieMotionHumanArmClearance.IBaseline = NONE,
    prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  ): number {
    const terms: IAutoMovieMotionHumanArmClearance.IBaseline = roomTerms(
      body,
      pose,
      side,
      arm,
      others,
      baseline,
      prepared,
    );
    return Math.max(0, terms.forearm, terms.segments);
  }

  /*
   * Read both independent zero-allowance baselines on the same actual arm.
   */
  export function baseline(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  ): IAutoMovieMotionHumanArmClearance.IBaseline {
    const terms: IAutoMovieMotionHumanArmClearance.IBaseline = roomTerms(
      body,
      pose,
      side,
      arm,
      others,
      NONE,
      prepared,
    );
    return {
      forearm: Math.max(0, terms.forearm, terms.segments - Infinity),
      segments: Math.max(0, terms.forearm - Infinity, terms.segments),
    };
  }

  /*
   * An arm turned at the shoulder and the elbow until its room (`room`) is
   * within an allowance: the least turn, along the first direction of a fixed
   * order that clears it (`HumanArmClearing`), not the nearest clear arm in
   * every direction.
   *
   * A hanging arm lies along the flank, so a forearm that swings forward from
   * it while the upper arm turns inward crosses the front of the waist, and a
   * person lets the elbow out as the hand comes up; a hand raised toward
   * someone who stands close would pass through them, and a person folds the
   * elbow and brings the hand up near their own chest. Both are one rule over
   * the two freedoms that move a forearm without a goal, the upper arm's
   * abduction and the elbow's flexion: `HumanArmClearing` takes the least turn,
   * along the first of its fixed order of directions that clears the arm,
   * inside both joints' ranges. The room is not smooth (a forearm leaves one
   * shape as it meets another), so no slope is followed. When no direction
   * clears the arm, the turn with the least room is taken.
   * Parameter body: The body.
   * Parameter pose: The pose the arm is read in.
   * Parameter side: The arm.
   * Parameter arm: The arm's joint angles.
   * Parameter allowed: The room the arm may lack, degrees.
   * Parameter others: Another body's placed colliders in the arm's way; none when
   * absent.
   * Parameter baseline: What each of `room`'s readings may keep; none when absent.
   * Parameter source: Optional exact FK reader or lazy supplier borrowed only by
   * actual room observations in this synchronous search.
   * Returns: The arm's joint angles, the hand's unchanged.
   */
  export function cleared(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    allowed: number,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    baseline: IAutoMovieMotionHumanArmClearance.IBaseline = NONE,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanArmClearance.IArm {
    let prepared: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> | undefined;
    let borrowed: ReturnType<typeof prepareHumanPoseResolution> | undefined;
    let first: boolean = true;
    const over: (of: IAutoMovieMotionHumanArmClearance.IArm) => number = (
      of: IAutoMovieMotionHumanArmClearance.IArm,
    ): number => {
      const value: number = room(
        body,
        pose,
        side,
        of,
        others,
        baseline,
        source === undefined
          ? first
            ? undefined
            : (prepared ??= AutoMovieEngineKinematics.preparePoseResolution())
          : (borrowed ??= prepareHumanPoseResolution(source))(),
      );
      first = false;
      return value - allowed;
    };
    const outside: ReturnType<typeof prepareHumanJointRom> =
      prepareHumanJointRom(body);
    return HumanArmClearing({
      arm,
      over,
      range: (of: IAutoMovieMotionHumanArmClearance.IArm): number =>
        outside(`${side}UpperArm`, of.upper) +
        outside(`${side}LowerArm`, of.lower),
    });
  }
}

/*
 * Keep overshoot, its allowance read, tangle and its allowance read in original
 * order.
 */
function roomTerms(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
  arm: IAutoMovieMotionHumanArmClearance.IArm,
  others: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  baseline: IAutoMovieMotionHumanArmClearance.IBaseline,
  prepared?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
): IAutoMovieMotionHumanArmClearance.IBaseline {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    HumanArmClearance.posed(pose, side, arm),
    prepared,
  );
  const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
    HumanColliders.placed(body, bones);
  return {
    forearm:
      HumanArmClearance.overshoot(
        body,
        HumanArmClearance.obstacles(
          body,
          bones,
          [side === "left" ? "right" : "left"],
          placed,
        ),
        bones.get(`${side}LowerArm`)!.worldPosition,
        bones.get(`${side}Hand`)!.worldPosition,
        side,
        others,
        false,
      ) - baseline.forearm,
    segments:
      AutoMovieMotionHumanAuditTangle.arm(body, bones, side, placed) -
      baseline.segments,
  };
}

/*
 * No baseline: every reading of an arm's room counts from zero.
 */
const NONE: IAutoMovieMotionHumanArmClearance.IBaseline = {
  forearm: 0,
  segments: 0,
};
