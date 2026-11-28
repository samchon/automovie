import type { IAutoMovieRecoveryLinkedTrack } from "..";

/**
 * Bounded reciprocal feature components and counts measured before geometric
 * fitting.
 */
export interface IAutoMovieRecoveryTrackLinkage {
  /** Nonconflicting appearance components available to fitting. */
  tracks: IAutoMovieRecoveryLinkedTrack[];

  /**
   * Number of distinct linked view-feature nodes, excluding isolated extracted
   * features.
   */
  linkedObservations: number;

  /** Total connected components before filtering duplicate-view conflicts. */
  components: number;

  /** Components withheld for multiple observations from one view. */
  conflictingComponents: number;

  /** Number of forward match rows with a reciprocal reverse index pair. */
  intersectionMatches: number;
}
