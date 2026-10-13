import { IAutoMovieTimingAnchor } from "../harness/IAutoMovieTimingAnchor";

/** One actor's ordered prose intent and sparse authoritative moments. */
export interface IAutoMovieBlockingActor {
  /** Staged actor node. */
  node: string;

  /** Ordered action intent; dense motion remains engine-owned. */
  beats: string;

  /** Sparse causal anchors the action spans must cover in listed order. */
  anchors?: IAutoMovieTimingAnchor[];
}
