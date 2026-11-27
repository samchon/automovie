import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Caller-owned cross-frame Verlet and reseeding history. Joint maps use
 * physical node ids, while translation-centre history uses an opaque
 * centre/ordered-chain tuple. Removed driver history remains until the caller
 * resets/discards state.
 */
export interface IAutoMovieSpringState {
  /**
   * Joint id to previous world position, empty before the first step;
   * stepSpring advances the map in place.
   */
  prev: Map<string, IAutoMovieVector3>;

  /**
   * Internal JSON tuple [center node id, ordered chain ids] to that chain's
   * center position on its previous step. Distinct chains sharing a center
   * retain independent translation compensation; callers leave keys opaque.
   */
  centers: Map<string, IAutoMovieVector3>;

  /**
   * Joint id to post-spring position. resolveFrame reseeds newly composed
   * frames from these records so history survives frame composition.
   */
  sprung: Map<string, IAutoMovieVector3>;
}
