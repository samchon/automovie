import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Cranium and overall head proportion: the frame the features sit in.
 *
 * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `IAutoMovieHeadShape` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `IAutoMovieHeadShape` as a coarse proxy parameter under the representation-fidelity ceiling.
 * @author Samchon
 */
export interface IAutoMovieHeadShape {
  /**
   * Lateral width of the whole face: `+` wider, `-` narrower.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `width` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `width` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  width?: AutoMovieFaceWeight;
  /**
   * Vertical stretch about the eye line: `+` longer, `-` shorter/rounder.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `length` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `length` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  length?: AutoMovieFaceWeight;
  /**
   * Toward an oval outline (`+`) vs a squarer one (`-`).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `oval` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `oval` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  oval?: AutoMovieFaceWeight;
  /**
   * Toward a round outline (`+`) vs a rectangular one (`-`).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `round` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `round` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  round?: AutoMovieFaceWeight;
  /**
   * Forehead front slope: `+` forward/upright, `-` receding.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `foreheadSlope` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `foreheadSlope` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  foreheadSlope?: AutoMovieFaceWeight;
  /**
   * Forehead vertical height: `+` taller (childlike), `-` shorter.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `foreheadHeight` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `foreheadHeight` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  foreheadHeight?: AutoMovieFaceWeight;
  /**
   * Forehead/cranial bossing (Nubian curvature).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `foreheadBulge` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `foreheadBulge` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  foreheadBulge?: AutoMovieFaceWeight;
  /**
   * Temple width at the side of the forehead.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `templeWidth` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `templeWidth` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  templeWidth?: AutoMovieFaceWeight;
  /**
   * Occiput (back-of-skull) depth: `+` more projection in profile.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `occiputDepth` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `occiputDepth` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  occiputDepth?: AutoMovieFaceWeight;
}
