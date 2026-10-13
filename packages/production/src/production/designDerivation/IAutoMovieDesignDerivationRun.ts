import type { IAutoMovieDesignDerivationManifest } from "./IAutoMovieDesignDerivationManifest";
import type { IAutoMovieDesignDerivationOutcome } from "./IAutoMovieDesignDerivationOutcome";

/**
 * Candidate manifest and successful per-target outcomes in the original plan order.
 *
 * @evidence contracts/common.md#principled-implementation Run returns its observed candidate manifest and declared-order outcomes only after every selected sequential store accepts.
 * @evidence contracts/common.md#clear-and-simple-design Canonical lineage inventory and publication-order status are separate arrays with their actual producing orders preserved.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Store failure can leave partial effects without this result; live basis was rechecked before stores, not after every write or at a transactional commit.
 * @evidence contracts/common.md#meaningful-documentation Defines returned manifest versus readonly outcome-array intent and distinguishes successful return from physical all-or-nothing publication.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; run retains its repeated source capture, dual evaluation, canonicalization and callback publication costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Results belong to one observed run; later source/store changes need fresh capture and cannot reuse this result solely by target count.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains candidate basis/digests and outcome metadata until replacement, with input-sized populations and no native transaction acquired by the shape.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDerivationRun {
  /** Complete derivation manifest for the published target inventory. */
  manifest: IAutoMovieDesignDerivationManifest;

  /** Per-target publication outcome, in the declared plan order. */
  outcomes: readonly IAutoMovieDesignDerivationOutcome[];
}
