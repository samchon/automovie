import { getConstraint, jointRomOvershoot } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";

/**
 * Read actual joint ROM overshoot during one synchronous evaluation whose
 * skeleton bone order and identities stay unchanged. Only each bone's first
 * matching record is shared; current constraints and angles are still read
 * for every score. A later evaluation creates a new reader.
 *
 * @param body The body with unchanged skeleton membership/order for this evaluation.
 * @returns A reader of a bone's clinical triple, degrees, returning the original ROM overshoot in degrees, including its null/nonfinite cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the synchronous fixed-topology lifetime, first-match provenance, clinical degree input and actual ROM score returned.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the original first-matching skeleton record, while getConstraint still resolves its current override/default and jointRomOvershoot still performs every actual candidate score; only redundant record lookup is shared.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A lazy local map holds each requested first bone or absence; the returned reader first materializes the clinical triple, then resolves the same record/constraint and delegates the score.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves first duplicate, absent-bone fallback, current constraint/table lookup, angle read order and all ROM queries. It caches no angle, projection, constraint answer or candidate score and adds no tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms For C scores naming U bones in a B-bone skeleton, first-match scans cost O(UB) instead of O(CB), followed by O(1) lookups plus every original ROM computation. The map is allocated only at the first actual score.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed skeleton membership/order proves each first-match record remains the same within this evaluation; its constraint field and the canonical default table are still read anew, and another evaluation obtains a new map.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns this synchronous reader and at most U borrowed records/null markers, releasing them with the evaluation. It creates no map if never called and keeps no global body, pose or result cache.
 */
export function prepareHumanJointRom(
  body: IAutoMovieMotionHumanBody,
): (bone: AutoMovieHumanoidBone, angles: readonly [number, number, number]) => number {
  let records: Map<AutoMovieHumanoidBone, IAutoMovieBone | null> | undefined;
  return (bone: AutoMovieHumanoidBone, angles: readonly [number, number, number]): number => {
    const joint: IAutoMovieJointPose = {
      bone,
      flexion: angles[0],
      abduction: angles[1],
      twist: angles[2],
    };
    if (records === undefined) records = new Map();
    let record: IAutoMovieBone | null | undefined = records.get(bone);
    if (record === undefined) {
      record = readHumanBone(body, bone) ?? null;
      records.set(bone, record);
    }
    return jointRomOvershoot(joint, getConstraint(bone, record?.constraint ?? null));
  };
}
