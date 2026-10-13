import type { IAutoMovieRetainedPilotHost } from "./IAutoMovieRetainedPilotHost";


/**
 * Passed film-pilot state required by a complete-production reset.
 *
 * @evidence contracts/common.md#principled-implementation Version one and kind film discriminate a receipt whose first-pilot group and complete ordered narrative ladder authorize a later reset while preserving retained hosts.
 * @evidence contracts/common.md#clear-and-simple-design Film-specific ladder and partition facts live in the film receipt, separate from library design/source-pair admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The historical reviewedBranches field remains the version-one protocol spelling rather than silently changing existing receipt meaning.
 * @evidence contracts/common.md#meaningful-documentation Members identify the absolute production root, recording owner, exact pilot group, completed ladder and retained host identities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The film receipt shape performs no narrative-ladder validation until its validator reads it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A passed film receipt records predecessor facts without sharing review effects across productions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased receipt schema acquires no archive or history; its recording caller supplies the retained-host array, and validateAutoMoviePopulationTransition borrows those identity records while comparing current reset sources.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieFilmPopulationTransitionReceipt {
  /** Versioned receipt syntax. */
  version: 1;

  /** Production shape whose pilot passed. */
  kind: "film";

  /** Absolute production root bound to the receipt. */
  productionLocation: string;

  /** Human or process owner that recorded the transition. */
  owner: string;

  /** Exact prior film pilot population. */
  pilotScope: {
    mode: "first-pilot";
    partitionGroup: `001-${string}`;
  };

  /** Completed film ladder. The field name preserves version-1 compatibility. */
  reviewedBranches: readonly [
    "treatments",
    "scripts",
    "screenplays",
    "screenplayNaturalness",
  ];

  /** Pilot hosts preserved into the reset tree. */
  retainedHosts: readonly IAutoMovieRetainedPilotHost[];
}
