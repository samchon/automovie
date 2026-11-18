import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanClaspClearance } from "./HumanClaspClearance";

/**
 * The clasp candidates an arm may take, and the displayed frames their
 * clearance test reads: of the fits that reach the clasp within `reached`,
 * those in the lowest upper-arm band they attain; every fit when none
 * reaches.
 *
 * @param body The body, unchanged through the search.
 * @param side The offered hand and its arm.
 * @param reaches Every turn's grasp-and-stroke fit, in turn order.
 * @param reached The largest miss that counts as reaching (`HumanClasp.REACHED`), degrees plus millimetres.
 * @param bands The upper limits of the upper-arm bands, degrees of the upper arm from hanging (`HumanClasp.BANDS`).
 * @returns The admitted indices into `reaches`, and the lower arm, hand and digit frames of each admitted fit, world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the admission rule, its fallback, the units of both bounds and the frames returned per admitted index.
 * @evidence contracts/development/implementation.md#principled-implementation The upper arm's angle from hanging is the angle between the shoulder-to-elbow line and world down, read on the fitted pose; its band is the first Rapid Upper Limb Assessment limit at or above it, past the last band when above all.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reach admission, then band admission on two bones, then the contact frames of the admitted fits only; the bounds come from the caller so the clasp's constants have one owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No band or reach bound of its own; an arm no turn brings within reach keeps every turn, so the clasp still ranks them by clearance.
 * @evidence contracts/development/implementation.md#efficient-algorithms For C candidates, R reaching and A admitted, two-bone FK runs R times and the seventeen-bone contact FK A times, sharing one FK workspace.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One FK workspace serves every pose of this synchronous search; each pose is resolved on its own.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The workspace and readers end at return; the returned frame maps belong to the caller's pair search.
 */
export function HumanClaspCandidateFrames(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  reaches: readonly IAutoMovieMotionHumanGrasp.IReach[],
  reached: number,
  bands: readonly number[],
): {
  /** Indices into `reaches` admitted by reach and by the lowest attained upper-arm band. */
  indices: number[];
  /** Lower arm, hand and digit frames of each admitted fit, world metres. */
  bones: Map<number, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>>;
} {
  const all: number[] = reaches.map((_reach: IAutoMovieMotionHumanGrasp.IReach, index: number): number => index);
  const within: number[] = all.filter((index: number): boolean => reaches[index]!.miss <= reached);
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  let indices: number[] = all;
  if (within.length !== 0) {
    const readBand: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`, `${side}LowerArm`]));
    const band: number[] = within.map((index: number): number => {
      const frames: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = readBand(reaches[index]!.pose, resolution());
      const upper: IAutoMovieVector3 = Vector3.subtract(
        frames.get(`${side}LowerArm`)!.worldPosition, frames.get(`${side}UpperArm`)!.worldPosition);
      const raised: number = (Math.acos(Math.max(-1, Math.min(1, -upper.y / Vector3.length(upper)))) * 180) / Math.PI;
      const found: number = bands.findIndex((limit: number): boolean => raised <= limit);
      return found === -1 ? bands.length : found;
    });
    const lowest: number = Math.min(...band);
    indices = within.filter((_index: number, position: number): boolean => band[position] === lowest);
  }
  const readContact: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, HumanClaspClearance.bones(side));
  return { indices, bones: new Map(indices.map((index: number): [number, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>] =>
    [index, readContact(reaches[index]!.pose, resolution())])) };
}
