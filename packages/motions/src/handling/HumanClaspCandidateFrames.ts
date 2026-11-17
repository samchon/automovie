import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanClasp } from "./HumanClasp";
import { HumanClaspClearance } from "./HumanClaspClearance";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * Read only the original clasp candidates' consumed posture and contact frames.
 *
 * @param body Unchanged canonical body/rig throughout this synchronous candidate selection.
 * @param side The offered hand and arm whose original posture band is measured.
 * @param reaches Every original complete grasp/stroke fit in authored turn order.
 * @returns Original admitted indices and their fresh observed contact frames; no losing candidate contact map is produced.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original reached/lowest-band admission, all-candidate fallback and fresh actual contact frame maps indexed by the original candidate positions.
 * @evidence contracts/development/implementation.md#principled-implementation Retains HumanClasp.REACHED and BANDS, the original upper-arm-from-hanging acos/clipping formula and first band lookup. Candidates with no reached fit keep the original all-indices fallback; otherwise only the original lowest reached band remains.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar reach admission precedes two-bone band observations; admitted candidates alone receive the complete original hand/digit/forearm geometry demand from HumanClaspClearance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fit, candidate, band limit, fallback, contact segment, pair test or tie rule changes. Every source pose's authored joints still undergo canonical FK admission before observed output is produced.
 * @evidence contracts/development/implementation.md#efficient-algorithms For C original candidates, R reached fits and A admitted fits, band output is 2R frames and contact output is 17A rather than 18C eager combined frames. Band angle evaluates once per reached fit; all original pair work remains. An all-admitted search may add band reads, and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body/side and exact supplied poses remain unchanged while one exact FK workspace serves band and contact observations; only identical scalar prerequisites are reused, never a pose result, fit or contact verdict.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Name readers, scalar bands and the exact workspace end at return/throw. Returned indices/maps are owned only by the synchronous clasp pair search and retain no body, reader, candidate array, callback or time history.
 */
export function HumanClaspCandidateFrames(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
  reaches: readonly IAutoMovieMotionHumanGrasp.IReach[]): {
    /** Original indices admitted by reach and lowest attained upper-arm band. */
    indices: number[];
    /** Actual observed arm/hand/digit frames of those admitted fits only. */
    bones: Map<number, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>>;
  } {
  const all: number[] = reaches.map((_reach: IAutoMovieMotionHumanGrasp.IReach, index: number): number => index);
  const reached: number[] = all.filter((index: number): boolean => reaches[index]!.miss <= HumanClasp.REACHED);
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  let indices: number[] = all;
  if (reached.length !== 0) {
    const readBand: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`, `${side}LowerArm`]));
    const bands: number[] = reached.map((index: number): number => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = readBand(reaches[index]!.pose, resolution());
      const upper: IAutoMovieVector3 = Vector3.subtract(
        bones.get(`${side}LowerArm`)!.worldPosition, bones.get(`${side}UpperArm`)!.worldPosition);
      const raised: number = (Math.acos(Math.max(-1, Math.min(1, -upper.y / Vector3.length(upper)))) * 180) / Math.PI;
      const found: number = HumanClasp.BANDS.findIndex((limit: number): boolean => raised <= limit);
      return found === -1 ? HumanClasp.BANDS.length : found;
    });
    const lowest: number = Math.min(...bands);
    indices = reached.filter((_index: number, position: number): boolean => bands[position] === lowest);
  }
  const readContact: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, HumanClaspClearance.bones(side));
  return { indices, bones: new Map(indices.map((index: number): [number, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>] =>
    [index, readContact(reaches[index]!.pose, resolution())])) };
}
