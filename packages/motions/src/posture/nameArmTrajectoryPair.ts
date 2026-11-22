import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/** The digits' part of a bone name. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/;

/**
 * A probe and the shape it enters, named for a refusal: the arm segment the
 * probe rides and the bone the shape rides, with its collider part, so a law
 * can fix the path at its cause.
 *
 * @param c The context.
 * @param a The arm.
 * @param k The waypoint.
 * @param probe The probe's index.
 * @param shape The shape's index.
 * @returns The probe and shape as words.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is named and why.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the frame's own probe owners and shape bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three lookups: the probe's owner, its part's bone, the shape.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No reading is changed; only its message.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work, on a refusal's message only.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function nameArmTrajectoryPair(
  c: M.IContext,
  a: number,
  k: number,
  probe: number,
  shape: number,
): string {
  const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
  const owner: string =
    probe >= G.SURFACE
      ? (frame.owners[probe - G.SURFACE] ?? "arm")
      : probe < 2
        ? "upper"
        : probe < 6
          ? "lower"
          : "hand";
  // A probe on a digit names the digit's own bone (`rightThumbDistal`):
  // the hand's probes carry its fingers too.
  const part: number | undefined =
    probe >= G.SURFACE ? frame.segments[probe - G.SURFACE] : undefined;
  const bone: string | undefined =
    part === undefined
      ? undefined
      : frame.colliders.find(
          (
            collider: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number],
          ): boolean => collider.part === part,
        )?.bone;
  const segment: string =
    bone !== undefined && DIGIT.test(bone)
      ? bone
      : owner === "upper"
        ? "upper arm"
        : owner === "lower"
          ? "forearm"
          : owner;
  const target: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
    frame.shapes[shape];
  return `the ${segment}'s probe ${probe} inside ${target === undefined ? `shape ${shape}` : `the obstacle ${target.bone} (shape ${shape}, collider part ${target.part})`}`;
}
