import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Jaw and chin.
 *
 * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `IAutoMovieHeadJaw` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `IAutoMovieHeadJaw` as a coarse proxy parameter under the representation-fidelity ceiling.
 * @author Samchon
 */
export interface IAutoMovieHeadJaw {
  /**
   * Gonial/jaw width: `+` wider/squarer, `-` softer/tapered (feminine).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `width` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `width` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  width?: AutoMovieFaceWeight;

  /**
   * Jaw drop / lower-face length at the angle.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `drop` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `drop` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  drop?: AutoMovieFaceWeight;

  /**
   * Chin vertical length: `+` longer, `-` shorter (feminine/childlike).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `chinLength` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `chinLength` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  chinLength?: AutoMovieFaceWeight;

  /**
   * Chin width: `+` broader, `-` narrower/pointed.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `chinWidth` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `chinWidth` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  chinWidth?: AutoMovieFaceWeight;

  /**
   * Chin forward projection: `+` prominent, `-` recessive (East-Asian).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `chinProjection` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `chinProjection` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  chinProjection?: AutoMovieFaceWeight;
}
