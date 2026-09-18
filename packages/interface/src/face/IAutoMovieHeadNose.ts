import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Nose. `bridge` is the East-Asian-defining radix-height control.
 *
 * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `IAutoMovieHeadNose` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `IAutoMovieHeadNose` as a coarse proxy parameter under the representation-fidelity ceiling.
 * @author Samchon
 */
export interface IAutoMovieHeadNose {
  /**
   * Alar/overall width: `+` wider, `-` narrower.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `width` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `width` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  width?: AutoMovieFaceWeight;
  /**
   * Length down the face: `+` longer, `-` shorter.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `length` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `length` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  length?: AutoMovieFaceWeight;
  /**
   * Forward projection of the whole nose.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `projection` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `projection` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  projection?: AutoMovieFaceWeight;
  /**
   * Dorsal hump: `+` convex/humped, `-` scooped.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `hump` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `hump` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  hump?: AutoMovieFaceWeight;
  /**
   * Tip vertical angle: `+` upturned, `-` drooping.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `tipAngle` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `tipAngle` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  tipAngle?: AutoMovieFaceWeight;
  /**
   * Nostril width.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `nostrilWidth` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `nostrilWidth` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  nostrilWidth?: AutoMovieFaceWeight;
  /**
   * Nasal base height (sub-nasal).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `baseHeight` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `baseHeight` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  baseHeight?: AutoMovieFaceWeight;
  /**
   * Bridge/radix height: `+` higher straight bridge, `-` flatter (East-Asian).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `bridge` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `bridge` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  bridge?: AutoMovieFaceWeight;
}
