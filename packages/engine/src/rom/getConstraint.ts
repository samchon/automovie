import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { DEFAULT_HUMANOID_ROM } from "./constants/DEFAULT_HUMANOID_ROM";

/**
 * Borrow a nonnull supplied override, otherwise the default humanoid constraint, otherwise null. Null override means fallback rather than explicit disablement; this lookup validates no numerical bounds.
 *
 * @evidence contracts/common.md#principled-implementation Select a supplied nonnull override, otherwise the default humanoid entry, otherwise null for an unconstrained bone.
 * @evidence contracts/common.md#clear-and-simple-design One lookup owner shares precedence across selective and full pose clamps without copying the ROM table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null override means fallback rather than disablement; interval admission is separate and default norms are a baseline rather than population-specific anatomy.
 * @evidence contracts/common.md#meaningful-documentation Docs state override/default/null precedence and borrowed result with degree/numeric validation owned elsewhere.
 * @evidence contracts/performance.md#efficient-algorithms One nullish/table lookup requires constant work with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers borrow the same constraint records and new calls observe changed override/table contents without wrapper caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a borrowed record/null returns, with no skeleton, pose, native handle or task retained.
 */
export const getConstraint: (
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
) => IAutoMovieJointConstraint | null = (
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
): IAutoMovieJointConstraint | null =>
  override ?? DEFAULT_HUMANOID_ROM[bone] ?? null;
