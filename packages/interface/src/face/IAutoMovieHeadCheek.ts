import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Cheeks and cheekbones.
 *
 * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `IAutoMovieHeadCheek` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `IAutoMovieHeadCheek` as a coarse proxy parameter under the representation-fidelity ceiling.
 * @author Samchon
 */
export interface IAutoMovieHeadCheek {
  /**
   * Soft cheek fullness: `+` fuller (youthful), `-` gaunt.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `fullness` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `fullness` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  fullness?: AutoMovieFaceWeight;

  /**
   * Malar/cheekbone prominence: `+` higher/sharper (mature beauty).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `bones` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `bones` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  bones?: AutoMovieFaceWeight;
}
