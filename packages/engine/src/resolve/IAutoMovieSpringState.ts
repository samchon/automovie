import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Caller-owned cross-frame Verlet and reseeding history. Joint maps use physical node ids, while translation-centre history uses an opaque centre/ordered-chain tuple. Removed driver history remains until the caller resets/discards state.
 *
 * @evidence contracts/development/design.md#principled-representation Retain previous and post-spring joint positions for Verlet stepping plus previous centre translations keyed by the centre/ordered-chain tuple, so distinct chains sharing a centre compensate independently.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three explicit maps distinguish integrator history, centre translation transport and reseeding a freshly composed frame from prior spring output.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Centre transport is translation-only; state is not a full rigid-body history and shared physical joints still share joint-position entries.
 * @evidence contracts/development/common.md#meaningful-documentation Members document opaque chain keys, initially empty maps and in-place ownership; no automatic driver-removal eviction is promised.
 */
export interface IAutoMovieSpringState {
  /**
   * Joint id to previous world position, empty before the first step; stepSpring advances the map in place.
   */
  prev: Map<string, IAutoMovieVector3>;

  /**
   * Internal JSON tuple [center node id, ordered chain ids] to that chain's
   * center position on its previous step. Distinct chains sharing a center
   * retain independent translation compensation; callers leave keys opaque.
   */
  centers: Map<string, IAutoMovieVector3>;

  /**
   * Joint id to post-spring position. resolveFrame reseeds newly composed frames from these records so history survives frame composition.
   */
  sprung: Map<string, IAutoMovieVector3>;
}
