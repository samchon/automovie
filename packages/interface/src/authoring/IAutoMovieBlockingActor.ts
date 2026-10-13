import { IAutoMovieTimingAnchor } from "../harness/IAutoMovieTimingAnchor";

/**
 * One actor's ordered prose intent and the sparse moments its performance must
 * hit.
 *
 * The anchors are the only machine-checked part: their listed order is the
 * causal order of the beat, so a later anchor may not land earlier in time,
 * and every anchor must fall inside an action of this actor once the
 * performance is compiled.
 *
 * @evidence contracts/common.md#principled-implementation `blockBeat` walks the anchors once in listed order, refusing a non-finite `t`, one outside `[0, duration]`, and one earlier than the last finite predecessor; `performShot` then requires some action naming this node whose span contains `t` within `1e-9` s, so the order check and the coverage check together keep the stated causality.
 * @evidence contracts/common.md#clear-and-simple-design The record is a node join key, one prose field and an optional anchor list; timing alignment lives in the engine gates, so the intent stores no derived action spans.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal anchor times are accepted because simultaneous moments are ordinary staging, and no node, cue text or actor kind changes the rule; `beats` is declared unchecked rather than parsed for verbs.
 * @evidence contracts/common.md#meaningful-documentation States which node the intent may name, that the prose is never read, that list order is causal order, the inclusive time window, and that each anchor must be covered by one of the actor's actions.
 * @author Samchon
 */
export interface IAutoMovieBlockingActor {
  /**
   * Non-blank staged scene node this intent belongs to; `blockBeat` refuses an
   * id the staged scene does not place.
   */
  node: string;

  /**
   * Ordered prose of what the actor does in the beat, for review; no gate reads
   * it, and dense motion stays engine-owned.
   */
  beats: string;

  /**
   * Sparse causal anchors in listed order. Each `t` is finite, lies within
   * `[0, duration]` of the beat, is never earlier than its predecessor, and
   * must fall inside some action this actor performs. Omitted means no moment
   * is pinned.
   */
  anchors?: IAutoMovieTimingAnchor[];
}
