/**
 * What plays at one output instant: the live entry's shot at its local time,
 * plus, inside the live entry's incoming transition, the outgoing entry's tail
 * and the incoming weight ramping from 0 to 1 across the transition.
 *
 * `resolveFromTimeline` and `playbackCursor` build it with the same arithmetic,
 * so random access and a forward sweep return identical samples for the same
 * instant; `resolveSequencePlayback` and `playbackFrameSamples` return it, and
 * the render and caption plans turn it into frames and cues.
 */
export interface IAutoMoviePlaybackSample {
  /** Id of the live (incoming) shot. */
  shot: string;

  /** Shot-local seconds into the live shot. */
  time: number;

  /** The outgoing tail being dissolved from, or null outside a transition. */
  blend: {
    /** Id of the outgoing shot, the previous sequence entry's shot. */
    shot: string;

    /** Shot-local seconds into the outgoing shot. */
    time: number;

    /**
     * Weight of the incoming live shot in `[0, 1)`: 0 at the transition's first
     * instant, rising linearly with output time; at the transition's end the
     * sample has no `blend`.
     */
    alpha: number;
  } | null;
}
