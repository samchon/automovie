import type {
  AutoMovieHumanoidBone,
  IAutoMovieCapsuleProxy,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/**
 * Require distinct skeleton endpoints that are declared and FK-reachable, plus finite positive radius.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Require distinct skeleton endpoints that are declared and FK-reachable, plus finite positive radius.
 * @evidence contracts/common.md#clear-and-simple-design One canonical interface capsule serves collision, self-intersection and ground-contact gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure appends errors and returns false, so an unusable endpoint is not replaced by a guessed pose.
 * @evidence contracts/common.md#meaningful-documentation Radius uses model units, endpoint membership/reachability and boolean usability are stated.
 * @evidence contracts/performance.md#efficient-algorithms Two set lookups and fixed scalar comparisons cost expected constant work plus text.
 * @evidence contracts/performance.md#reuse-equivalent-work Sampling validators reuse precomputed skeleton/reachable sets across their capsules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs and sets are borrowed; the caller owns diagnostics and the helper retains no resolved body or handle.
 */
export const validateCapsule: (
  capsule: IAutoMovieCapsuleProxy,
  path: string,
  skeletonBones: ReadonlySet<AutoMovieHumanoidBone>,
  reachableBones: ReadonlySet<AutoMovieHumanoidBone>,
  collector: ViolationCollector,
) => boolean = (
  capsule: IAutoMovieCapsuleProxy,
  path: string,
  skeletonBones: ReadonlySet<AutoMovieHumanoidBone>,
  reachableBones: ReadonlySet<AutoMovieHumanoidBone>,
  collector: ViolationCollector,
): boolean => {
  let valid: boolean = true;
  const endpoint: (bone: AutoMovieHumanoidBone, at: string) => void = (
    bone: AutoMovieHumanoidBone,
    at: string,
  ): void => {
    if (!skeletonBones.has(bone)) {
      valid = false;
      collector.push(
        "type",
        `${path}.${at}`,
        `capsule endpoint "${bone}" must exist in the target skeleton`,
        bone,
      );
    } else if (!reachableBones.has(bone)) {
      valid = false;
      collector.push(
        "type",
        `${path}.${at}`,
        `capsule endpoint "${bone}" is declared but not reachable from a root bone via forward kinematics`,
        bone,
      );
    }
  };
  endpoint(capsule.from, "from");
  endpoint(capsule.to, "to");
  if (capsule.from === capsule.to) {
    valid = false;
    collector.push(
      "type",
      path,
      "capsule endpoints must be two distinct bones",
      { from: capsule.from, to: capsule.to },
    );
  }
  if (!Number.isFinite(capsule.radius) || capsule.radius <= 0) {
    valid = false;
    collector.push(
      "range",
      `${path}.radius`,
      `capsule radius must be a finite number > 0, but was ${capsule.radius}`,
      capsule.radius,
    );
  }
  return valid;
};
