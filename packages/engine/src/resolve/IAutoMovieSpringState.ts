import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Caller-owned cross-frame Verlet and reseeding history. Joint maps use physical node ids, while translation-centre history uses an opaque centre/ordered-chain tuple. Removed driver history remains until the caller resets/discards state.
 *
 * @evidence contracts/common.md#principled-implementation Retain previous and post-spring joint positions for Verlet stepping plus previous centre translations keyed by the centre/ordered-chain tuple, so distinct chains sharing a centre compensate independently.
 * @evidence contracts/common.md#clear-and-simple-design Three explicit maps distinguish integrator history, centre translation transport and reseeding a freshly composed frame from prior spring output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Centre transport is translation-only; state is not a full rigid-body history and shared physical joints still share joint-position entries.
 * @evidence contracts/common.md#meaningful-documentation Members document opaque chain keys, initially empty maps and in-place ownership; no automatic driver-removal eviction is promised.
 * @evidence contracts/performance.md#efficient-algorithms Storage grows with visited joint ids and centre/chain tuples; map lookup is expected O(1), with key creation proportional to chain-id text.
 * @evidence contracts/performance.md#reuse-equivalent-work resolveFrame reuses post-spring positions across freshly composed frames and stepSpring reuses prior history; changed scene/driver identity requires caller-controlled reset.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The scene caller owns the maps and discards/replaces them when finished; removed chains remain retained until that reset, with no intrinsic population bound or host handle.
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
