import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearance } from "./HumanArmClearance";
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";

/**
 * One arm's room (`HumanArmClearance.room`) read for many joint angles of
 * that arm in one pose: a search that turns only the arm (a swing's added
 * abduction) reads the same number for each candidate as `room` does, while
 * the rest of the body is posed and placed once.
 *
 * The pose's bones are read once. Each candidate then writes the arm's three
 * joints over the pose as edits of the engine's fixed-source reader, which
 * recomposes only the bones below the shoulder, and only those bones' profile
 * segments are placed again; every other bone and placed segment is the one
 * read at preparation, which no joint of the arm moves.
 *
 * @param body The body.
 * @param pose The pose; the trunk, the legs and the other arm are read where it puts them, once.
 * @param side The arm.
 * @param others Another body's placed colliders in the arm's way; none when absent.
 * @param baseline What each of the two readings may keep, degrees; none when absent.
 * @param operation The synchronous evaluation's FK reader, whose conversions the preparation shares; a private one when absent.
 * @param read The pose's bones and placed segments, where the caller holds them for this very pose's values (`HumanArmSwing.of`'s second arm, posed as the first left it); read here when absent.
 * @param threshold Optional decision boundary. Once the actual excess exceeds it a witness suffices. Without it the complete numeric maximum is returned.
 * @returns The room of the arm at given joint angles, degrees, as `HumanArmClearance.room` reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is fixed at preparation, what each candidate recomputes, the unit and the lifetime of the reader.
 * @evidence contracts/development/implementation.md#principled-implementation A bone's frame depends only on its own and its ancestors' joints and the root, so the arm's three joints move only the shoulder's subtree. The fixed-source reader admits the pose once and composes that subtree from each candidate's edits through the same parent-first recurrence and arithmetic as a whole-pose read of the edited pose, and a profile segment's placement reads only its own bone, so each candidate's bones and placed segments hold the values `room` computes from the whole pose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation reads and places the body; the returned reader edits, replaces the subtree's bones and segments in their original places and takes the two readings in `room`'s order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm joint the pose does not carry is not written, as `HumanArmClearance.posed` leaves it; the placed segments keep the profile's order, and a subtree placement whose count differs from the body's own falls back to placing the whole body. No reading is kept between candidates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation costs one whole-pose read and placement, O(B+S) for B bones and S segments, none where the caller hands them. An exactly unchanged arm may reuse the base bones after every matching joint record is checked. A decision-bound query stops at the first observed violation. An ordinary changed candidate costs three admitted edits, the subtree's bones (the arm and its hand), a B-entry map copy, the subtree's segments and an S-entry array copy, then the two readings' own queries.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The pose, body, side, external colliders and baseline are fixed for the reader's life; bones and segments outside the shoulder's subtree are shared across candidates because no candidate changes a joint above or beside them; what the tangle reading prepares of a still placed segment is kept across candidates with that same placed record, and a moved segment's is cleared when it is replaced.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader owns one bone map, one placement, one fixed-source workspace and the subtree's names until its search releases it; it stores no candidate, reading or reader beyond that.
 */
export function prepareHumanArmRoom(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
  others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
  baseline: IAutoMovieMotionHumanArmClearance.IBaseline = { forearm: 0, segments: 0 },
  operation?: ReturnType<typeof preparePoseResolution>,
  read?: prepareHumanArmRoom.IRead,
  threshold?: number,
): (arm: IAutoMovieMotionHumanArmClearance.IArm, compareBase?: boolean) => number {
  const upper: AutoMovieHumanoidBone = `${side}UpperArm`;
  const lower: AutoMovieHumanoidBone = `${side}LowerArm`;
  const hand: AutoMovieHumanoidBone = `${side}Hand`;

  // The bones the arm's joints move: the shoulder's subtree.
  const moved: Set<AutoMovieHumanoidBone> = new Set();
  const pending: AutoMovieHumanoidBone[] = [upper];
  while (pending.length !== 0) {
    const bone: AutoMovieHumanoidBone = pending.pop()!;
    if (moved.has(bone)) continue;
    moved.add(bone);
    const children: readonly IAutoMovieBone[] | undefined = body.topology.childrenByParent.get(bone);
    if (children !== undefined) for (const child of children) pending.push(child.bone);
  }

  // Which of the arm's three joints the pose carries: only those are written.
  const carried: Set<AutoMovieHumanoidBone> = new Set();
  for (const joint of pose.joints)
    if (joint.bone === upper || joint.bone === lower || joint.bone === hand) carried.add(joint.bone);

  // The body as the pose puts it, read and placed once.
  const base: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    read?.bones ?? poseBones(body, pose, operation);
  const placed: IAutoMovieMotionHumanColliders.IPlaced[] = read?.placed ?? HumanColliders.placed(body, base);
  const slots: number[] = [];
  placed.forEach((segment: IAutoMovieMotionHumanColliders.IPlaced, index: number): void => {
    if (moved.has(segment.bone)) slots.push(index);
  });
  const place: ReturnType<typeof HumanColliders.preparePlaced> = HumanColliders.preparePlaced(body, moved);
  const fixed: ReturnType<IAutoMovieMotionHumanBody["poseResolution"]["preparePose"]> =
    body.poseResolution.preparePose(pose, moved, operation);
  const other: readonly AutoMovieHumanSide[] = [side === "left" ? "right" : "left"];
  const targets: NonNullable<Parameters<typeof AutoMovieMotionHumanAuditTangle.arm>[4]> = [];

  const exceeded: ((degrees: number) => boolean) | undefined = threshold === undefined
    ? undefined : (degrees: number): boolean => degrees - baseline.segments > threshold;
  function measure(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    current: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    prepared: Parameters<typeof AutoMovieMotionHumanAuditTangle.arm>[4],
  ): number {
    const forearm: number = HumanArmClearance.overshoot(body,
      HumanArmClearance.obstacles(body, bones, other, current),
      bones.get(lower)!.worldPosition, bones.get(hand)!.worldPosition,
      side, others, false) - baseline.forearm;
    if (threshold !== undefined && forearm > threshold) return forearm;
    const segments: number = AutoMovieMotionHumanAuditTangle.arm(body, bones, side, current, prepared, exceeded) - baseline.segments;
    return Math.max(0, forearm, segments);
  }

  return (arm: IAutoMovieMotionHumanArmClearance.IArm, compareBase?: boolean): number => {
    if (compareBase === true && prepareHumanArmRoom.matches(pose, side, arm))
      return measure(base, placed, undefined);
    const edits: IAutoMovieJointPose[] = [];
    for (const [bone, angles] of [[upper, arm.upper], [lower, arm.lower], [hand, arm.hand]] as const)
      if (carried.has(bone))
        edits.push({ bone, flexion: angles[0], abduction: angles[1], twist: angles[2] });

    // The whole body's bones in their original order, the subtree's replaced.
    const turned: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = fixed.resolveMap(edits);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(base);
    for (const [bone, frame] of turned) if (bones.has(bone)) bones.set(bone, frame);

    // The whole body's placed segments in the profile's order, the subtree's replaced.
    const again: IAutoMovieMotionHumanColliders.IPlaced[] = place(bones);
    const current: IAutoMovieMotionHumanColliders.IPlaced[] = again.length === slots.length
      ? placed.slice() : HumanColliders.placed(body, bones);
    let prepared: Parameters<typeof AutoMovieMotionHumanAuditTangle.arm>[4];
    if (again.length === slots.length) {
      // The still segments are the very placed records of every candidate, so
      // what the tangle reading prepares of them is kept for the search; a
      // moved segment's entry is cleared with its replacement.
      for (let index: number = 0; index < slots.length; ++index) {
        current[slots[index]!] = again[index]!;
        targets[slots[index]!] = undefined;
      }
      prepared = targets;
    }

    return measure(bones, current, prepared);
  };
}
/**
 * The readings a caller may hand the preparation (`IRead`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds.
 * @evidence contracts/development/design.md#principled-representation The preparation's own two readings of its pose, as their owners give them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No reading of a candidate is handed in or out.
 */
export namespace prepareHumanArmRoom {
  /** Whether writing an arm back (`HumanArmClearance.posed`) leaves every record of its three joints with the values it holds. */
  export function matches(
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
  ): boolean {
    const written: Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> = {
      [`${side}UpperArm`]: arm.upper,
      [`${side}LowerArm`]: arm.lower,
      [`${side}Hand`]: arm.hand,
    };
    return pose.joints.every((joint: IAutoMovieJointPose): boolean => {
      const angles: readonly [number, number, number] | undefined = written[joint.bone];
      return (
        angles === undefined ||
        (Object.is(joint.flexion, angles[0]) &&
          Object.is(joint.abduction, angles[1]) &&
          Object.is(joint.twist, angles[2]))
      );
    });
  }

  /**
   * A pose's bones and placed segments, as `poseBones` and
   * `HumanColliders.placed` give them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the two members are and whose readings they are.
   * @evidence contracts/development/design.md#principled-representation The two readings the preparation takes of its pose, handed in as they are.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The bones and the segments, nothing else.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither is copied or edited by the preparation (it copies the map and the array before replacing entries).
   */
  export interface IRead {
    /** Each bone's frame. */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    /** The placed segments, in the profile's order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];
  }
}