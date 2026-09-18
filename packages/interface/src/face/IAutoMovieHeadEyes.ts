import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Eyes: symmetric shared controls (asymmetry is a future global axis). The
 * `epicanthus`/`fold` cues are the East-Asian-defining controls.
 *
 * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `IAutoMovieHeadEyes` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `IAutoMovieHeadEyes` as a coarse proxy parameter under the representation-fidelity ceiling.
 * @author Samchon
 */
export interface IAutoMovieHeadEyes {
  /**
   * Overall eye size relative to the face: `+` larger (feminine/young).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `size` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `size` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  size?: AutoMovieFaceWeight;
  /**
   * Lid aperture openness: `+` more open, `-` narrower.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `openness` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `openness` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  openness?: AutoMovieFaceWeight;
  /**
   * Inter-eye spacing: `+` wider-set (cute/neoteny), `-` closer.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `spacing` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `spacing` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  spacing?: AutoMovieFaceWeight;
  /**
   * Outer-canthus tilt: `+` up (youthful), `-` down.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `tilt` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `tilt` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  tilt?: AutoMovieFaceWeight;
  /**
   * Eyeball protrusion in the socket: `+` more prominent, `-` deeper-set.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `depth` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `depth` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  depth?: AutoMovieFaceWeight;
  /**
   * Epicanthic fold at the inner corner: `+` more (East-Asian), `-` open.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `epicanthus` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `epicanthus` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  epicanthus?: AutoMovieFaceWeight;
  /**
   * Upper-lid fold: `+` hooded/mono-lid, `-` deeper double-lid crease.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `fold` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `fold` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  fold?: AutoMovieFaceWeight;
}
