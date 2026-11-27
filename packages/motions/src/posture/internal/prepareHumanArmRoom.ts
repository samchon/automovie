import { AutoMovieEngineKinematics } from "@automovie/engine";
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

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearance } from "./HumanArmClearance";
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";

/*
 * One arm's room (`HumanArmClearance.room`) read for many joint angles of that
 * arm in one pose: a search that turns only the arm (a swing's added abduction)
 * reads the same number for each candidate as `room` does, while the rest of
 * the body is posed and placed once.
 *
 * The pose's bones are read once. Each candidate then writes the arm's three
 * joints over the pose as edits of the engine's fixed-source reader, which
 * recomposes only the bones below the shoulder, and only those bones' profile
 * segments are placed again; every other bone and placed segment is the one
 * read at preparation, which no joint of the arm moves.
 * Parameter body: The body.
 * Parameter pose: The pose; the trunk, the legs and the other arm are read where it
 * puts them, once.
 * Parameter side: The arm.
 * Parameter others: Another body's placed colliders in the arm's way; none when
 * absent.
 * Parameter baseline: What each of the two readings may keep, degrees; none when
 * absent.
 * Parameter operation: The synchronous evaluation's FK reader, whose conversions
 * the preparation shares; a private one when absent.
 * Parameter read: The pose's bones and placed segments, where the caller holds them
 * for this very pose's values (`HumanArmSwing.of`'s second arm, posed as the
 * first left it); read here when absent.
 * Parameter threshold: Optional decision boundary. Once the actual excess exceeds
 * it a witness suffices. Without it the complete numeric maximum is
 * returned.
 * Returns: The room of the arm at given joint angles, degrees, as
 * `HumanArmClearance.room` reads it.
 */
export function prepareHumanArmRoom(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
  others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
  baseline: IAutoMovieMotionHumanArmClearance.IBaseline = {
    forearm: 0,
    segments: 0,
  },
  operation?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  read?: prepareHumanArmRoom.IRead,
  threshold?: number,
): (
  arm: IAutoMovieMotionHumanArmClearance.IArm,
  compareBase?: boolean,
) => number {
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
    const children: readonly IAutoMovieBone[] | undefined =
      body.topology.childrenByParent.get(bone);
    if (children !== undefined)
      for (const child of children) pending.push(child.bone);
  }

  // Which of the arm's three joints the pose carries: only those are written.
  const carried: Set<AutoMovieHumanoidBone> = new Set();
  for (const joint of pose.joints)
    if (joint.bone === upper || joint.bone === lower || joint.bone === hand)
      carried.add(joint.bone);

  // The body as the pose puts it, read and placed once.
  const base: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    read?.bones ?? poseBones(body, pose, operation);
  const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
    read?.placed ?? HumanColliders.placed(body, base);
  const slots: number[] = [];
  placed.forEach(
    (segment: IAutoMovieMotionHumanColliders.IPlaced, index: number): void => {
      if (moved.has(segment.bone)) slots.push(index);
    },
  );
  const place: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(body, moved);
  const fixed: ReturnType<
    IAutoMovieMotionHumanBody["poseResolution"]["preparePose"]
  > = body.poseResolution.preparePose(pose, moved, operation);
  const other: readonly AutoMovieHumanSide[] = [
    side === "left" ? "right" : "left",
  ];
  const targets: NonNullable<
    Parameters<typeof AutoMovieMotionHumanAuditTangle.arm>[4]
  > = [];

  const exceeded: ((degrees: number) => boolean) | undefined =
    threshold === undefined
      ? undefined
      : (degrees: number): boolean => degrees - baseline.segments > threshold;
  function measure(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    current: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    prepared: Parameters<typeof AutoMovieMotionHumanAuditTangle.arm>[4],
  ): number {
    const forearm: number =
      HumanArmClearance.overshoot(
        body,
        HumanArmClearance.obstacles(body, bones, other, current),
        bones.get(lower)!.worldPosition,
        bones.get(hand)!.worldPosition,
        side,
        others,
        false,
      ) - baseline.forearm;
    if (threshold !== undefined && forearm > threshold) return forearm;
    const segments: number =
      AutoMovieMotionHumanAuditTangle.arm(
        body,
        bones,
        side,
        current,
        prepared,
        exceeded,
      ) - baseline.segments;
    return Math.max(0, forearm, segments);
  }

  return (
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    compareBase?: boolean,
  ): number => {
    if (compareBase === true && prepareHumanArmRoom.matches(pose, side, arm))
      return measure(base, placed, undefined);
    const edits: IAutoMovieJointPose[] = [];
    for (const [bone, angles] of [
      [upper, arm.upper],
      [lower, arm.lower],
      [hand, arm.hand],
    ] as const)
      if (carried.has(bone))
        edits.push({
          bone,
          flexion: angles[0],
          abduction: angles[1],
          twist: angles[2],
        });

    // The whole body's bones in their original order, the subtree's replaced.
    const turned: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      fixed.resolveMap(edits);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      base,
    );
    for (const [bone, frame] of turned)
      if (bones.has(bone)) bones.set(bone, frame);

    // The whole body's placed segments in the profile's order, the subtree's replaced.
    const again: IAutoMovieMotionHumanColliders.IPlaced[] = place(bones);
    const current: IAutoMovieMotionHumanColliders.IPlaced[] =
      again.length === slots.length
        ? placed.slice()
        : HumanColliders.placed(body, bones);
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
/*
 * The readings a caller may hand the preparation (`IRead`).
 */
export namespace prepareHumanArmRoom {
  /*
   * Whether writing an arm back (`HumanArmClearance.posed`) leaves every record
   * of its three joints with the values it holds.
   */
  export function matches(
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
  ): boolean {
    const written: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {
      [`${side}UpperArm`]: arm.upper,
      [`${side}LowerArm`]: arm.lower,
      [`${side}Hand`]: arm.hand,
    };
    return pose.joints.every((joint: IAutoMovieJointPose): boolean => {
      const angles: readonly [number, number, number] | undefined =
        written[joint.bone];
      return (
        angles === undefined ||
        (Object.is(joint.flexion, angles[0]) &&
          Object.is(joint.abduction, angles[1]) &&
          Object.is(joint.twist, angles[2]))
      );
    });
  }

  /*
   * A pose's bones and placed segments, as `poseBones` and
   * `HumanColliders.placed` give them.
   */
  export interface IRead {
    /*
     * Each bone's frame.
     */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    /*
     * The placed segments, in the profile's order.
     */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];
  }
}
