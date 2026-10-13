import { IAutoMovieTimingAnchor } from "../harness/IAutoMovieTimingAnchor";

/**
 * One actor's ordered prose intent and sparse authoritative moments.
 *
 * @evidence contracts/common.md#principled-implementation Anchor list order is the causal order: `blockBeat` refuses an anchor time outside `[0, duration]` or earlier than its predecessor, and `performShot` refuses an anchor that no action of this actor spans within 1e-9 s.
 * @evidence contracts/common.md#clear-and-simple-design Keeps dense motion out of the plan with one prose `beats` string plus optional anchors, so the performance stage owns timing and this record pins only the moments it must honour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cue text is interpreted; `node` is checked against every staged scene node, so a set-piece id passes although the refusal message speaks of actors.
 * @evidence contracts/common.md#meaningful-documentation States that `beats` is ordered prose with dense motion left to the engine, that anchors run in causal list order, and which gates check `node` and anchor times.
 * @author Samchon
 */
export interface IAutoMovieBlockingActor {
  /**
   * Staged scene node this intent belongs to; `blockBeat` refuses an id the
   * staged scene does not place.
   */
  node: string;

  /** Ordered action intent; dense motion remains engine-owned. */
  beats: string;

  /**
   * Sparse causal anchors in listed order. Each `t` lies within the beat and
   * never before its predecessor, and some action of this actor must cover it.
   */
  anchors?: IAutoMovieTimingAnchor[];
}
