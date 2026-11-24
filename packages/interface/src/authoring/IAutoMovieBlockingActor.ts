import type { IAutoMovieTimingAnchor } from "../harness/IAutoMovieTimingAnchor";

/**
 * One staged scene node's prose intent and sparse ordered action-coverage
 * times.
 *
 * The node reference and anchor times are machine-checked; beats and cue text
 * are not interpreted. A later listed anchor may not land earlier in time, and
 * every anchor must lie within a non-frame action naming this node. Those
 * checks establish temporal order and interval coverage, not that the described
 * event occurred.
 */
export interface IAutoMovieBlockingActor {
  /**
   * Staged scene node this intent belongs to; blockBeat refuses an id absent
   * from scene.nodes, while duplicate intent rows remain permitted.
   */
  node: string;

  /**
   * Prose of what the node does in the beat, for review; no gate reads it, and
   * dense motion stays engine-owned.
   */
  beats: string;

  /**
   * Sparse ordered times. Each t is finite, lies within [0, duration], is never
   * earlier than its predecessor and must fall inside a non-frame action naming
   * this node. Omitted means no time is pinned.
   */
  anchors?: IAutoMovieTimingAnchor[];
}
