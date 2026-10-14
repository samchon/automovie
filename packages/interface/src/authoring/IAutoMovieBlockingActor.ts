import { IAutoMovieTimingAnchor } from "../harness/IAutoMovieTimingAnchor";

/**
 * One staged scene node's prose intent and sparse ordered action-coverage times.
 *
 * The node reference and anchor times are machine-checked; beats and cue text are not interpreted. A later listed anchor may not land earlier in time, and every anchor must lie within a non-frame action naming this node. Those checks establish temporal order and interval coverage, not that the described event occurred.
 *
 * @evidence contracts/common.md#principled-implementation blockBeat walks anchors in listed order, refusing nonfinite t, times outside [0, duration] and times earlier than the last finite predecessor. performShot then requires a non-frame action naming this node whose span contains t within 1e-9 s; this does not inspect cue prose or independently measure a causal event.
 * @evidence contracts/common.md#clear-and-simple-design The record is a node join key, one prose field and an optional anchor list; timing alignment lives in the engine gates, so the intent stores no derived action spans.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal anchor times are accepted because simultaneous moments are ordinary staging, and no node, cue text or actor kind changes the rule; `beats` is declared unchecked rather than parsed for verbs.
 * @evidence contracts/common.md#meaningful-documentation States which node the intent may name, that the prose is never read, that list order is causal order, the inclusive time window, and that each anchor must be covered by one of the actor's actions.
 * @author Samchon
 */
export interface IAutoMovieBlockingActor {
  /**
   * Non-blank staged scene node this intent belongs to; blockBeat refuses an id absent from scene.nodes, while duplicate intent rows remain permitted.
   */
  node: string;

  /**
   * Prose of what the node does in the beat, for review; no gate reads it, and dense motion stays engine-owned.
   */
  beats: string;

  /**
   * Sparse ordered times. Each t is finite, lies within [0, duration], is never earlier than its predecessor and must fall inside a non-frame action naming this node. Omitted means no time is pinned.
   */
  anchors?: IAutoMovieTimingAnchor[];
}
