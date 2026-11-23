import type { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition";

/**
 * What plays at one output instant: the live entry's shot at its local time,
 * plus, inside the live entry's incoming transition, the outgoing entry's tail,
 * the transition's kind and its progress from 0 to 1.
 *
 * `resolveFromTimeline` and `playbackCursor` build it with the same arithmetic,
 * so random access and a forward sweep return identical samples for the same
 * instant; `resolveSequencePlayback` and `playbackFrameSamples` return it, and
 * the render and caption plans turn it into frames and cues. `playbackLayersAt`
 * turns the same instant into the weighted shots a picture draws.
 */
export interface IAutoMoviePlaybackSample {
  /** Id of the live (incoming) shot. */
  shot: string;

  /** Shot-local seconds into the live shot. */
  time: number;

  /** The outgoing tail being blended from, or null outside a transition. */
  blend: {
    /** Id of the outgoing shot, the previous sequence entry's shot. */
    shot: string;

    /** Shot-local seconds into the outgoing shot. */
    time: number;

    /**
     * Progress through the transition in `[0, 1)`: 0 at its first instant,
     * rising linearly with output time; at the transition's end the sample has
     * no `blend`. It is the incoming shot's weight for a `crossDissolve`; a
     * `fade` weighs its shots as `IAutoMovieTransition` states.
     */
    alpha: number;

    /** The live entry's transition kind. */
    kind: IAutoMovieTransition["kind"];
  } | null;
}
