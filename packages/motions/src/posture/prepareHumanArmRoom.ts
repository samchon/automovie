import type {
  IAutoMovieResolvedBone,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import type { IHumanBody } from "../body/IHumanBody";
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
 * @returns The room of the arm at given joint angles, degrees, as `HumanArmClearance.room` reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is fixed at preparation, what each candidate recomputes, the unit and the lifetime of the reader.
 * @evidence contracts/development/implementation.md#principled-implementation A bone's frame depends only on its own and its ancestors' joints and the root, so the arm's three joints move only the shoulder's subtree. The fixed-source reader admits the pose once and composes that subtree from each candidate's edits through the same parent-first recurrence and arithmetic as a whole-pose read of the edited pose, and a profile segment's placement reads only its own bone, so each candidate's bones and placed segments hold the values `room` computes from the whole pose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation reads and places the body; the returned reader edits, replaces the subtree's bones and segments in their original places and takes the two readings in `room`'s order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm joint the pose does not carry is not written, as `HumanArmClearance.posed` leaves it; the placed segments keep the profile's order, and a subtree placement whose count differs from the body's own falls back to placing the whole body. No reading is kept between candidates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation costs one whole-pose read and placement, O(B+S) for B bones and S segments. A candidate costs three admitted edits, the subtree's bones (the arm and its hand), a B-entry map copy, the subtree's segments and an S-entry array copy, then the two readings' own queries.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The pose, body, side, external colliders and baseline are fixed for the reader's life; bones and segments outside the shoulder's subtree are shared across candidates because no candidate changes a joint above or beside them.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader owns one bone map, one placement, one fixed-source workspace and the subtree's names until its search releases it; it stores no candidate, reading or reader beyond that.
 */
export function prepareHumanArmRoom(
  body: IHumanBody,
  pose: IAutoMoviePose,
  side: "left" | "right",
  others: readonly HumanColliders.IPlaced[] = [],
  baseline: HumanArmClearance.IBaseline = { forearm: 0, segments: 0 },
  operation?: ReturnType<typeof preparePoseResolution>,
): (arm: HumanArmClearance.IArm) => number {
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
  const base: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose, operation);
  const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, base);
  const slots: number[] = [];
  placed.forEach((segment: HumanColliders.IPlaced, index: number): void => {
    if (moved.has(segment.bone)) slots.push(index);
  });
  const place: ReturnType<typeof HumanColliders.preparePlaced> = HumanColliders.preparePlaced(body, moved);
  const fixed: ReturnType<IHumanBody["poseResolution"]["preparePose"]> =
    body.poseResolution.preparePose(pose, moved, operation);
  const other: readonly ("left" | "right")[] = [side === "left" ? "right" : "left"];

  return (arm: HumanArmClearance.IArm): number => {
    const edits: IAutoMovieJointPose[] = [];
    for (const [bone, angles] of [[upper, arm.upper], [lower, arm.lower], [hand, arm.hand]] as const)
      if (carried.has(bone))
        edits.push({ bone, flexion: angles[0], abduction: angles[1], twist: angles[2] });

    // The whole body's bones in their original order, the subtree's replaced.
    const turned: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = fixed.resolveMap(edits);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(base);
    for (const [bone, frame] of turned) if (bones.has(bone)) bones.set(bone, frame);

    // The whole body's placed segments in the profile's order, the subtree's replaced.
    const again: HumanColliders.IPlaced[] = place(bones);
    const current: HumanColliders.IPlaced[] = again.length === slots.length
      ? placed.slice() : HumanColliders.placed(body, bones);
    if (again.length === slots.length)
      for (let index: number = 0; index < slots.length; ++index) current[slots[index]!] = again[index]!;

    const forearm: number = HumanArmClearance.overshoot(body,
      HumanArmClearance.obstacles(body, bones, other, current),
      bones.get(lower)!.worldPosition, bones.get(hand)!.worldPosition,
      side, others, false) - baseline.forearm;
    const segments: number = AutoMovieMotionHumanAuditTangle.arm(body, bones, side, current) - baseline.segments;
    return Math.max(0, forearm, segments);
  };
}
