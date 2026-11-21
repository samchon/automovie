import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The interior shares of a key-to-key blend read once to find whether any arm leaves its room. */
const SCAN: number = 16;

/** Arm rooms by side, degrees. */
type Rooms = Record<AutoMovieHumanSide, number>;

/**
 * The trunk as a constraint on a floor law's way between two of its
 * postures. Arm angles blended between two postures can carry a forearm
 * through the body deeper than either end holds it: rolling from the back
 * onto a side, the lower elbow bends before the shoulder has brought the arm
 * forward, and the forearm passes through the belly; the same happens
 * lowering into prone and into a cross-legged seat. A person lets that elbow
 * out instead. So an arm whose room (`HumanArmClearance.room`) exceeds the
 * ends' room blended by the same weight takes the least turn at the shoulder
 * and the elbow that brings it back within it (`HumanArmClearance.cleared`);
 * an arm no deeper than its ends is left as blended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect of a blend, where it occurs, the rule and when an arm is left alone.
 * @evidence contracts/development/design.md#principled-representation An arm's room is the clearance owner's degree reading; the allowance is the two ends' readings blended like the angles, as a floor law raises a blended body only past its ends' floor depth.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One preparation: a reader of one law's blends by key index.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The room and the turn are `HumanArmClearance`'s; no obstacle, margin or body is named here.
 */
export namespace floorArmRoom {
  /**
   * Prepare the clearance of one floor law's key-to-key blends.
   *
   * The first interior query of a blend reads the rooms of its two keys and
   * of `SCAN` evenly spaced blends between them; a blend whose arms stay
   * within their allowance at every one of those is then left exactly as
   * blended with no further reading, so only a blend that carries an arm
   * through the body pays a posture resolve per query.
   *
   * @param body The body.
   * @returns The blend at a weight with its arms kept within the keys' blended room.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The keys' rooms and the scan are read once per blend; a flagged blend reads each queried posture's rooms and turns an arm only past its allowance.
   * @evidence contracts/development/implementation.md#efficient-algorithms A blend that never leaves its room costs `SCAN + 2` resolves once and nothing per query; a flagged one costs one resolve and two room readings per query plus the clearance search where an arm is past its allowance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains, per blend index, two room records and a flag for the law plan's lifetime.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
  ): (
    index: number,
    weight: number,
    keyed: (weight: number) => IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture {
    const blends: { from: Rooms; to: Rooms; flagged: boolean }[] = [];
    return (index, weight, keyed, read, project) => {
      const posture: IAutoMovieMotionHumanPosture = keyed(weight);
      if (!(weight > 0 && weight < 1)) return posture;
      const allowed = (ends: { from: Rooms; to: Rooms }, w: number): Rooms => ({
        left: ends.from.left + (ends.to.left - ends.from.left) * w,
        right: ends.from.right + (ends.to.right - ends.from.right) * w,
      });
      let blend: { from: Rooms; to: Rooms; flagged: boolean } | undefined =
        blends[index];
      if (blend === undefined) {
        const ends: { from: Rooms; to: Rooms } = {
          from: rooms(body, posed(body, keyed(0), read, project)),
          to: rooms(body, posed(body, keyed(1), read, project)),
        };
        let flagged: boolean = false;
        for (let i: number = 1; i < SCAN && !flagged; i++) {
          const w: number = i / SCAN;
          const at: Rooms = rooms(body, posed(body, keyed(w), read, project));
          const limit: Rooms = allowed(ends, w);
          flagged = at.left > limit.left || at.right > limit.right;
        }
        blend = { ...ends, flagged };
        blends[index] = blend;
      }
      return blend.flagged
        ? cleared(body, posture, allowed(blend, weight), read, project)
        : posture;
    };
  }
}

/** The posture with each arm kept within its allowed room. */
function cleared(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  allowed: Readonly<Rooms>,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMovieMotionHumanPosture {
  let pose: IAutoMoviePose = posed(body, posture, read, project);
  let joints: IAutoMovieMotionHumanPosture["joints"] | undefined;
  for (const side of ["left", "right"] as const) {
    const blended: IAutoMovieMotionHumanArmClearance.IArm = arm(pose, side);
    if (HumanArmClearance.room(body, pose, side, blended) <= allowed[side])
      continue;
    const turned: IAutoMovieMotionHumanArmClearance.IArm =
      HumanArmClearance.cleared(body, pose, side, blended, allowed[side]);
    joints ??= { ...posture.joints };
    joints[`${side}UpperArm`] = turned.upper;
    joints[`${side}LowerArm`] = turned.lower;
    pose = HumanArmClearance.posed(pose, side, turned);
  }
  return joints === undefined ? posture : { ...posture, joints };
}

/** The room each arm of a resolved pose lacks, degrees. */
function rooms(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose): Rooms {
  return {
    left: HumanArmClearance.room(body, pose, "left", arm(pose, "left")),
    right: HumanArmClearance.room(body, pose, "right", arm(pose, "right")),
  };
}

/** The pose a posture resolves to. */
function posed(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMoviePose {
  return resolveHumanPosture.seeded(
    body,
    posture,
    undefined,
    undefined,
    read,
    undefined,
    project,
  ).pose;
}

/** An arm's clinical angles as a resolved pose displays them. */
function arm(
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanArmClearance.IArm {
  const angles = (bone: string): readonly [number, number, number] => {
    const joint: IAutoMoviePose["joints"][number] | undefined =
      pose.joints.find(
        (candidate: IAutoMoviePose["joints"][number]): boolean =>
          candidate.bone === bone,
      );
    return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
  };
  return {
    upper: angles(`${side}UpperArm`),
    lower: angles(`${side}LowerArm`),
    hand: angles(`${side}Hand`),
  };
}
