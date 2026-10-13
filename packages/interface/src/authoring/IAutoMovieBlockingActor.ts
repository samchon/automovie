import { IAutoMovieTimingAnchor } from "../harness/IAutoMovieTimingAnchor";

/**
 * One actor's ordered prose intent and sparse authoritative moments.
 *
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
