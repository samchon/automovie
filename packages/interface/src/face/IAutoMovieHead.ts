import { IAutoMovieHeadBrow } from "./IAutoMovieHeadBrow";
import { IAutoMovieHeadCheek } from "./IAutoMovieHeadCheek";
import { IAutoMovieHeadEyes } from "./IAutoMovieHeadEyes";
import { IAutoMovieHeadJaw } from "./IAutoMovieHeadJaw";
import { IAutoMovieHeadMouth } from "./IAutoMovieHeadMouth";
import { IAutoMovieHeadNose } from "./IAutoMovieHeadNose";
import { IAutoMovieHeadShape } from "./IAutoMovieHeadShape";

/**
 * A coarse full-head trait vector for authored morph templates. The engine's
 * `flattenHead` projects its leaves onto {@link AutoMovieHeadParameterName}
 * weights; the asset author supplies the neutral geometry and target deltas.
 * This retained vocabulary is independent of the numerical face documents in
 * `@automovie/human`.
 *
 * Anatomy-grouped so an LLM reads it the way a person reads a face; every leaf
 * is a signed weight in `[-2, 2]` (`0` = the unchanged template). Omitted fields
 * and groups mean neutral. The template determines the visible meaning of
 * each weight; expression is a separate contract.
 *
 * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `IAutoMovieHead` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `IAutoMovieHead` as a coarse proxy parameter under the representation-fidelity ceiling.
 * @author Samchon
 */
export interface IAutoMovieHead {
  /**
   * Cranium and overall proportion.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `shape` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `shape` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  shape?: IAutoMovieHeadShape;
  /**
   * Eyebrows.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `brow` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `brow` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  brow?: IAutoMovieHeadBrow;
  /**
   * Eyes (incl. epicanthus / eyelid fold).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `eyes` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `eyes` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  eyes?: IAutoMovieHeadEyes;
  /**
   * Nose (incl. bridge height).
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `nose` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `nose` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  nose?: IAutoMovieHeadNose;
  /**
   * Mouth and lips.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `mouth` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `mouth` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  mouth?: IAutoMovieHeadMouth;
  /**
   * Cheeks and cheekbones.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `cheek` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `cheek` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  cheek?: IAutoMovieHeadCheek;
  /**
   * Jaw and chin.
   *
   * @evidence requirements/actors/representation-tiers-and-fidelity-boundary.md#actor-direct-authoring-ceiling Keeps `jaw` inside the bounded direct-authoring proxy surface instead of claiming realistic likeness.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-representation-fidelity-boundary Types `jaw` as a coarse proxy parameter under the representation-fidelity ceiling.
   */
  jaw?: IAutoMovieHeadJaw;
}
