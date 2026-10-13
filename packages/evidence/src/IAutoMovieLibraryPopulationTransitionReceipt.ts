import type { IAutoMovieReviewedLibraryPair } from "./IAutoMovieReviewedLibraryPair";
import type { IAutoMovieRetainedPilotHost } from "./IAutoMovieRetainedPilotHost";


/**
 * Passed library-pilot state required by a complete-production reset.
 *
 * @evidence contracts/common.md#principled-implementation Version one and kind library discriminate a predecessor receipt with first-pilot scope, recorded completed design/source pairs and immutable retained host identities.
 * @evidence contracts/common.md#clear-and-simple-design Library receipts carry pair-based completion instead of the film receipt's narrative ladder and partition group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reviewedPairs field preserves the established protocol spelling; the reset validator independently requires one exact recognized pair.
 * @evidence contracts/common.md#meaningful-documentation Members state version, production root, recording owner, first-pilot scope, completed pairs and retained hosts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The library receipt declaration executes no branch validation or source hashing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A library predecessor receipt is historical evidence and coordinates no present construction effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased receipt schema opens no archive; its recording caller supplies pair and host arrays, while validateAutoMoviePopulationTransition borrows those records only for one current reset comparison.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieLibraryPopulationTransitionReceipt {
  /** Versioned receipt syntax. */
  version: 1;

  /** Production shape whose pilot passed. */
  kind: "library";

  /** Absolute production root bound to the receipt. */
  productionLocation: string;

  /** Human or process owner that recorded the transition. */
  owner: string;

  /** Exact prior library pilot population. */
  pilotScope: { mode: "first-pilot" };

  /** Completed pairs. The field name preserves version-1 compatibility. */
  reviewedPairs: readonly IAutoMovieReviewedLibraryPair[];

  /** Pilot hosts preserved into the reset tree. */
  retainedHosts: readonly IAutoMovieRetainedPilotHost[];
}
