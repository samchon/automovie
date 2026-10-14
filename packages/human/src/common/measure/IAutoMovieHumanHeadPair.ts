import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A bilateral pair of head points a rule found on one skin, right (-X) and
 * left (+X).
 *
 *
 * @evidence contracts/common.md#principled-implementation Both points belong to one head skin, with right at -X and left at +X; the owning rule supplies bilateral correspondence rather than population symmetry.
 * @evidence contracts/common.md#clear-and-simple-design Two named vectors preserve side identity while search and reflection algorithms remain outside this result shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not fabricate a missing side by mirroring or insert an expected anatomical location.
 * @evidence contracts/common.md#meaningful-documentation The declaration gives shared-skin origin and -X/+X convention; both members document metre units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This bilateral result performs no geometric search or transform; producing rules own that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair defines no cross-person reuse, and side identity depends on its producing head frame.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration retains no live resources; concrete vectors are caller-held values without hidden handles or registries.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadPair {
  /** The right-side point (-X), metres. */
  right: IAutoMovieVector3;

  /** The left-side point (+X), metres. */
  left: IAutoMovieVector3;
}
