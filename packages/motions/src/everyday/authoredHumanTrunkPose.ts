import { Transform } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { turnHumanPosture } from "../posture/turnHumanPosture";

/**
 * Construct the original raw authored pose for ordinary live-demand trunk FK.
 *
 * @param body The unchanged body supplying its actual skeleton id.
 * @param posture The current authored root/heading and optional whole-body rotation; limb goals remain ignored.
 * @param joints Current ordered clinical-degree joint override, including every unrequested/stray key.
 * @returns A fresh pose/joint list for immediate native FK admission, retaining Transform.of's existing root-frame borrowing convention.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines raw authored root/clinical units, ignored limb goals, exact joint override scope, later native admission and original fresh/borrowed ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The original Object.entries snapshot completes before every tuple F/A/T read; only then turnHumanPosture builds the same whole-body root and Transform.of supplies its original frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One complete ordered joint-list conversion precedes root construction and the original skeleton/root/joints carrier; ordinary HumanTrunk.resolve remains its actual consumer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every string key and tuple value passes unchanged to native admission, including invalid/unrequested entries. The existing bone type assertion filters nothing, and no limb fit, ROM clamp, root approximation, resolved flag or pose answer is substituted.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(J) original live conversion allocates J joint records and the entry snapshot. Fixed-demand consumers separately use the genuine staged tuple producer; this raw route retains its original live requested-set timing and failure staging without a measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses canonical turnHumanPosture/Transform owners and leaves all current joint/root admission with FK; no tuple, body, prior pose or current transform is used as a result-cache key.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds no operation state or history. The immediate caller owns the new pose/list/records and retains only the root subrecords according to the unchanged transform owner's borrowing policy.
 */
export function authoredHumanTrunkPose(body: IHumanBody, posture: IHumanPosture,
  joints: IHumanPosture["joints"]): IAutoMoviePose {
  const list: IAutoMovieJointPose[] = Object.entries(joints).map(
    ([bone, angles]: [string, readonly [number, number, number] | undefined]): IAutoMovieJointPose => ({
      bone: bone as AutoMovieHumanoidBone,
      flexion: angles![0],
      abduction: angles![1],
      twist: angles![2],
    }),
  );
  const turned: turnHumanPosture.ITurned = turnHumanPosture({ ...posture, limbs: {} });
  return {
    skeleton: body.skeleton.id,
    root: Transform.of(turned.position, turned.rotation),
    joints: list,
  };
}