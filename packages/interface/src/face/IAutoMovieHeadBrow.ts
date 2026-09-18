import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Eyebrows.
 *
 * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `IAutoMovieHeadBrow` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `IAutoMovieHeadBrow` as a coarse proxy parameter under the representation-fidelity ceiling.
 * @author Samchon
 */
export interface IAutoMovieHeadBrow {
  /**
   * Vertical brow position: `+` higher (feminine arch), `-` lower.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `height` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `height` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  height?: AutoMovieFaceWeight;
  /**
   * Brow tilt: `+` arched up, `-` angled down.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `angle` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `angle` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  angle?: AutoMovieFaceWeight;
}
