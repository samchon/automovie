/**
 * What plays at one output instant: the live entry's shot at its local time,
 * plus, inside an incoming transition, the outgoing entry's tail and the
 * incoming shot's weight ramping 0 → 1 across the transition.
 */
export interface IAutoMoviePlaybackSample {
  /** Live (incoming) shot id. */
  shot: string;

  /** Shot-local seconds into the live shot. */
  time: number;

  /** The outgoing tail being dissolved from, or null on a hard cut. */
  blend: { shot: string; time: number; alpha: number } | null;
}
