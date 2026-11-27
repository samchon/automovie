import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/*
 * A probe and the shape it enters, named for a refusal: the arm segment the
 * probe rides (a digit's own bone for a probe on a digit) with the bone of a
 * collider probe off the digits, and the bone the shape rides, with its
 * collider part, so a law can fix the path at its cause.
 * Parameter c: The context.
 * Parameter a: The arm.
 * Parameter k: The waypoint.
 * Parameter probe: The probe's index.
 * Parameter shape: The shape's index.
 * Returns: The probe and shape as words.
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
  // A collider probe off a digit names the bone it rides too, so the words
  // tell a palm's probe from an arm's.
  const on: string =
    bone === undefined || bone === segment ? "" : ` (on ${bone})`;
  return `the ${segment}'s probe ${probe}${on} inside ${target === undefined ? `shape ${shape}` : `the obstacle ${target.bone} (shape ${shape}, collider part ${target.part})`}`;
}

/*
 * The digits' part of a bone name.
 */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/;
