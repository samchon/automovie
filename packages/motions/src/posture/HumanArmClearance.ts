import {
  type IAutoMovieResolvedBone,
  getConstraint,
  jointRomOvershoot,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearing } from "./HumanArmClearing";
import { HumanArmOvershoot } from "./HumanArmOvershoot";
import { HumanArmSwing } from "./HumanArmSwing";
import { HumanColliders } from "./HumanColliders";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";

/**
 * The room a forearm needs beside its own trunk and beside the other arm.
 *
 * The other arm's room is the far side of the chest's median plane: an elbow
 * crosses it only as far as its wrist's goal does.
 *
 * A hand goal fixes the wrist and leaves the elbow free on a circle. An
 * elbow place whose point is outside the trunk can still run the forearm
 * through it, so the forearm is judged along its whole length: its axis,
 * sampled from the elbow toward the wrist, keeps the forearm's radius from
 * the colliders of the trunk, the neck and the head at the elbow, tapering to
 * the wrist's own clearance at the wrist, where the palm lies on the surface
 * the hand was sent to. The limb fit, which places the legs before the arms,
 * judges the thighs too (`obstacles`); a caller that poses only the trunk
 * judges the trunk alone (`trunk`).
 *
 * An arm that is not fitted to a goal but carried in joint space between two
 * arms has no elbow place to choose and no goal under its wrist; it is read
 * whole (`room`), against another body's colliders too when one stands in its
 * way, and its elbow let out or folded until the forearm asks no more room
 * than the carry's two ends hold (`cleared`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is judged, against which colliders, the taper and which caller judges the thighs.
 * @evidence contracts/development/design.md#principled-representation A capsule of linearly tapering radius against the body's own profile colliders, the shapes every contact verdict measures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The trunk's placed colliders, those with the thighs, a forearm's overshoot, an arm written into a pose, the same read off an arm's joints, and the turn of the shoulder and the elbow that relieves it; the single owner of forearm clearance, read by the bend solver, by every arm fit and by the arm's joint-space carry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is the body's measured forearm radius and the colliders are the profile's; no margin is added and no law is named.
 */
export namespace HumanArmClearance {
  /**
   * The colliders a forearm may not enter, placed by a pose's bones.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame; only the trunk's are read.
   * @returns The placed segments of the hips, the spine, the chest, the neck and the head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which segments are returned and what is read.
   * @evidence contracts/development/implementation.md#principled-implementation Placement is `HumanColliders.placed`, the single owner; this function only keeps the trunk's segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the profile's segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function trunk(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): HumanColliders.IPlaced[] {
    return HumanColliders.placed(body, bones).filter(
      (segment: HumanColliders.IPlaced): boolean => TRUNK.has(segment.bone),
    );
  }

  /**
   * The colliders a forearm may not enter in a pose whose legs are placed:
   * the trunk's, both thighs' and those of any arm already placed.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame, the legs where the pose puts them.
   * @param arms The arms already placed whose upper arm, forearm and hand count; none when absent.
   * @returns The placed segments of `trunk`, of the two upper legs and of the named arms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which segments are returned and what the pose must already hold.
   * @evidence contracts/development/implementation.md#principled-implementation A hand sent to a thigh, or past one, bends its elbow away from the thigh as it does from the ribs; the limb fit places the legs before the arms, so the thighs stand where the posture puts them. Two forearms sent across each other (a self-hug, a hand on the other forearm) lie one over the other, so the arm placed second keeps clear of the first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shanks and feet are left out: a forearm reaches them only with the hand, which the taper leaves to its goal; an arm not yet placed is left out, since where it will be is not known.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the profile's segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function obstacles(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    arms: readonly ("left" | "right")[] = [],
  ): HumanColliders.IPlaced[] {
    const limbs: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>(
        arms.flatMap((arm: "left" | "right"): AutoMovieHumanoidBone[] => [
          `${arm}UpperArm`,
          `${arm}LowerArm`,
          `${arm}Hand`,
        ]),
      );
    return HumanColliders.placed(body, bones).filter(
      (segment: HumanColliders.IPlaced): boolean =>
        TRUNK.has(segment.bone) ||
        segment.bone === "leftUpperLeg" ||
        segment.bone === "rightUpperLeg" ||
        limbs.has(segment.bone),
    );
  }

  /**
   * How far a forearm lies inside the room it needs, as degrees of upper arm
   * turn (`HumanArmOvershoot.of`, which states the rule).
   *
   * @param body The body, for the forearm's radius and the upper arm's length.
   * @param shapes The trunk's placed colliders (`trunk`).
   * @param elbow The elbow, world metres.
   * @param wrist The wrist, world metres.
   * @param side The arm.
   * @param others Placed colliders the wrist has no goal on (another body's); none when absent.
   * @param goal Whether the wrist is where a goal put it, which excuses its own depth in `shapes`; a carried arm between its ends has none.
   * @param rival The world point the other arm's goal will put its wrist at, while that arm is still to be fitted; absent, the room is kept unless the other arm's colliders are among `shapes`.
   * @param hint The world point the goal hints the elbow toward; none when absent.
   * @param rests Placed colliders of another body the goal lays the hand on; none when absent.
   * @returns Degrees; 0 when the forearm clears every shape and the elbow keeps its side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, each input and the meaning of 0; the rule is the reading's own.
   * @evidence contracts/development/implementation.md#principled-implementation The reading is `HumanArmOvershoot.of`, kept as this owner's entry so every caller of the clearance reads one name.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The reading's own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanArmOvershoot.of`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function overshoot(
    body: IHumanBody,
    shapes: readonly HumanColliders.IPlaced[],
    elbow: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    side: "left" | "right",
    others: readonly HumanColliders.IPlaced[] = [],
    goal: boolean = true,
    rival?: IAutoMovieVector3,
    hint?: IAutoMovieVector3,
    rests: readonly HumanColliders.IPlaced[] = [],
  ): number {
    return HumanArmOvershoot.of(
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

  /**
   * Turn the bounding-sphere screen of `overshoot` off or on again
   * (`HumanArmOvershoot.broad`).
   *
   * @param on Whether queries are screened.
   */
  export function broad(on: boolean): void {
    HumanArmOvershoot.broad(on);
  }

  /**
   * An arm's joint angles: `[flexion, abduction, twist]` of the upper arm,
   * the lower arm and the hand, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three members, their order and unit.
   * @evidence contracts/development/design.md#principled-representation The clinical triples a pose holds for the three joints of an arm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all written into the pose `room` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No side and no bone name: the functions that read it take the side.
   */
  export interface IArm {
    /** The upper arm's angles. */
    upper: readonly [number, number, number];

    /** The lower arm's angles. */
    lower: readonly [number, number, number];

    /** The hand's angles. */
    hand: readonly [number, number, number];
  }

  /**
   * A pose with one arm's three joints replaced.
   *
   * @param pose The pose.
   * @param side The arm.
   * @param arm The arm's joint angles.
   * @returns The pose, every other joint as it was.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is replaced and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The pose holds each joint's clinical triple, so the arm is written as its triples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint the pose does not carry is not added; the canonical pose carries every bone.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the joints with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function posed(
    pose: IAutoMoviePose,
    side: "left" | "right",
    arm: IArm,
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
      joints: pose.joints.map((joint: IAutoMovieJointPose) => {
        const angles = written[joint.bone];
        return angles === undefined
          ? joint
          : {
              ...joint,
              flexion: angles[0],
              abduction: angles[1],
              twist: angles[2],
            };
      }),
    };
  }

  /** The bones of the five digits, by their names. */
  export const DIGITS: RegExp = /(Thumb|Index|Middle|Ring|Little)/;

  /**
   * A pose with one hand's fingers written at given angles, so an arm's room
   * reads the fingers it is shown with: the ones the hand holds at that
   * instant, or those it held where the arm was read.
   *
   * @param pose The pose.
   * @param side The hand.
   * @param fingers Clinical triples by bone; the other hand's and every other bone's are ignored.
   * @returns The pose, every other joint as it was.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written, what is ignored and why.
   * @evidence contracts/development/implementation.md#principled-implementation The tangle audit reads the fingers as the pose shows them, so the room that keeps them clear must read the same fingers; the pose holds each joint's clinical triple.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the joints, as `posed`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only that hand's digit bones are written.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the joints with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fingered(
    pose: IAutoMoviePose,
    side: "left" | "right",
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

  /**
   * A forearm's overshoot (`overshoot`) with the arm at given joint angles
   * in a pose.
   *
   * @param body The body.
   * @param pose The pose; the trunk, the legs and the other arm are read where it puts them.
   * @param side The arm.
   * @param arm The arm's joint angles, which replace the pose's.
   * @param others Another body's placed colliders in the arm's way; none when absent.
   * @param baseline What each of the two readings may keep, degrees (`IBaseline`); none when absent.
   * @returns Degrees; 0 when the forearm clears the trunk, the thighs, the other arm and the others, and no segment of the arm lies deeper in the body than at rest or in the quiet stance, each beyond its baseline.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is replaced, what is read and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's three joints are written into the pose (`posed`) and the bones resolved by the engine's forward kinematics, so the forearm judged is the one the pose displays; the other arm is where the pose shows it, so a carry clears it as it stands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose with three joints replaced, one resolve, one overshoot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The obstacles are the limb fit's (`obstacles`), so a carried arm and a fitted one are judged against the same shapes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `posed`, `poseBones`, `obstacles`, `overshoot` and the tangle audit's arm reading, so the clearing and the audit share one measure.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function room(
    body: IHumanBody,
    pose: IAutoMoviePose,
    side: "left" | "right",
    arm: IArm,
    others: readonly HumanColliders.IPlaced[] = [],
    baseline: IBaseline = NONE,
  ): number {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      posed(pose, side, arm),
    );
    // The forearm's needed room by its radius, and every segment of the arm,
    // the upper arm and the fingers too, as the tangle audit reads it.
    return Math.max(
      0,
      overshoot(
        body,
        obstacles(body, bones, [side === "left" ? "right" : "left"]),
        bones.get(`${side}LowerArm`)!.worldPosition,
        bones.get(`${side}Hand`)!.worldPosition,
        side,
        others,
        false,
      ) - baseline.forearm,
      AutoMovieMotionHumanAuditTangle.arm(body, bones, side) -
        baseline.segments,
    );
  }

  /**
   * What each reading of `room` may keep: the forearm's needed room and the
   * arm's segments by the tangle audit, degrees. Each is measured against
   * its own value in a reference posture, since one reading's slack is not
   * room for the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members, their unit and why they are apart.
   * @evidence contracts/development/design.md#principled-representation One allowance per reading, so a thick flank that the hanging forearm already touches lends no depth to the fingers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by `room`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No combined slack.
   */
  export interface IBaseline {
    /** The forearm's needed room `overshoot` reads, degrees. */
    forearm: number;

    /** The arm's segments' depth the tangle audit reads, degrees. */
    segments: number;
  }

  /**
   * An arm turned at the shoulder and the elbow until its room (`room`) is
   * within an allowance: the least turn, along the first direction of a
   * fixed order that clears it (`HumanArmClearing`), not the nearest clear
   * arm in every direction.
   *
   * A hanging arm lies along the flank, so a forearm that swings forward
   * from it while the upper arm turns inward crosses the front of the waist,
   * and a person lets the elbow out as the hand comes up; a hand raised
   * toward someone who stands close would pass through them, and a person
   * folds the elbow and brings the hand up near their own chest. Both are
   * one rule over the two freedoms that move a forearm without a goal, the
   * upper arm's abduction and the elbow's flexion: `HumanArmClearing` takes
   * the least turn, along the first of its fixed order of directions that
   * clears the arm, inside both joints' ranges. The room is not smooth (a
   * forearm leaves one shape as it meets another), so no slope is followed.
   * When no direction clears the arm, the turn with the least room is taken.
   *
   * @param body The body.
   * @param pose The pose the arm is read in.
   * @param side The arm.
   * @param arm The arm's joint angles.
   * @param allowed The room the arm may lack, degrees.
   * @param others Another body's placed colliders in the arm's way; none when absent.
   * @param baseline What each of `room`'s readings may keep; none when absent.
   * @returns The arm's joint angles, the hand's unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two movements, the one rule behind them, the order of the search, the bisection, the fallback and each argument's unit.
   * @evidence contracts/development/implementation.md#principled-implementation The least correction that clears the arm, over the two freedoms that carry a forearm off what it passes; the direction comes from the shapes in the way, so no obstacle is named.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of HumanArmClearing.of over the room and range readings built here.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin is added and no joint leaves its range; a turn that leaves a range is skipped, not clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One room reading when the arm is clear; otherwise what HumanArmClearing.of reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `room`, the engine's range reading and `HumanArmClearing`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing per call.
   */
  export function cleared(
    body: IHumanBody,
    pose: IAutoMoviePose,
    side: "left" | "right",
    arm: IArm,
    allowed: number,
    others: readonly HumanColliders.IPlaced[] = [],
    baseline: IBaseline = NONE,
  ): IArm {
    const over = (of: IArm): number =>
      room(body, pose, side, of, others, baseline) - allowed;
    return HumanArmClearing.of({
      arm,
      over,
      range: (of: IArm): number =>
        outside(body, `${side}UpperArm`, of.upper) +
        outside(body, `${side}LowerArm`, of.lower),
    });
  }

  /**
   * A posture whose arms, written by joint angles with no hand goal (a
   * gait's swing), are kept clear of the body: a swinging arm passing the
   * thigh is let out at the shoulder, so each named arm takes the least added
   * abduction, up to `HumanArmSwing.SPAN`, at which each reading of its room is within that
   * reading in the quiet stance (`IBaseline`), found by bisection; an arm
   * that swings no deeper than it hangs is left as written.
   *
   * @param body The body.
   * @param posture The posture, the arms' joints set and their goals absent.
   * @param sides The arms to keep clear.
   * @returns The posture with the arms' upper arm joints let out.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which arms, against what allowance and what is written back.
   * @evidence contracts/development/implementation.md#principled-implementation A hanging arm's fingers lie against the thigh in the quiet stance, which the tangle audit takes as its baseline; the swing may come that near and no nearer, the same rule the audit reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve, then one bisection per arm in the pose the arms before it were written into; the least abduction is continuous in time where the room is, so the swing has no jump a local search between frames would leave.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm with a hand goal is the fit's to clear and is left alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve per call, one room reading for an arm already clear and about twelve for one that is not; the stance's room is solved once per body and arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `room` and `posed`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The stance rooms are kept per live body in a `WeakMap`.
   */
  export function swung(
    body: IHumanBody,
    posture: IHumanPosture,
    sides: readonly ("left" | "right")[],
  ): IHumanPosture {
    return HumanArmSwing.of(body, posture, sides);
  }
}

/** A joint's range of motion overshoot at a triple, degrees. */
function outside(
  body: IHumanBody,
  bone: AutoMovieHumanoidBone,
  of: readonly [number, number, number],
): number {
  return jointRomOvershoot(
    { bone, flexion: of[0], abduction: of[1], twist: of[2] },
    getConstraint(
      bone,
      body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    ),
  );
}

/** The bones whose colliders a forearm may not enter. */
const TRUNK: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
  ]);

/** No baseline: every reading of an arm's room counts from zero. */
const NONE: HumanArmClearance.IBaseline = { forearm: 0, segments: 0 };
