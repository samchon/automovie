import type { IAutoMovieRecoveryLinkedTrack } from "../../index";

/** Linked-only appearance populations and explicit duplicate-view exclusions. */
export interface IAutoMovieRecoveryTrackLinkage {
  /** Owned nonconflicting components, before any geometric point acceptance. */
  tracks: IAutoMovieRecoveryLinkedTrack[];

  /** Number of feature nodes participating in at least one retained link. */
  linkedObservations: number;

  /** Total linked components, including those withheld for duplicate views. */
  components: number;

  /** Components containing different feature indices from the same view. */
  conflictingComponents: number;

  /** Directed-pair identities present in both forward and reverse matching. */
  intersectionMatches: number;
}
