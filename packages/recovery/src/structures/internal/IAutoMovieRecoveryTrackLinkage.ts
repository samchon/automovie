import type { IAutoMovieRecoveryLinkedTrack } from "./IAutoMovieRecoveryLinkedTrack";

/**
 * Linked-only appearance populations and explicit duplicate-view exclusions.
 *
 * @evidence contracts/development/design.md#principled-representation Components count all linked union components, while tracks contain only those satisfying the unique-view identity invariant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Scalar populations distinguish linked observations, all components, withheld conflicts and directed-pair intersections.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Withheld conflicts are not split to create extra tracks and nonconflicting tracks are not accepted geometric points.
 * @evidence contracts/development/common.md#meaningful-documentation Counts refer to linked feature nodes and components, excluding unlinked singleton features.
 */
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
