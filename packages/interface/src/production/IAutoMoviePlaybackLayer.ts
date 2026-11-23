/**
 * One shot of a sequence as a picture draws it at one output instant: the
 * sequence entry it plays, its shot-local second and its compositing weight.
 *
 * `playbackLayersAt` makes them from the same live entry and arithmetic as
 * `playbackCursor` and `resolveFromTimeline`, outgoing layer first. Outside a
 * transition the one layer is the live entry at weight 1. Inside a
 * `crossDissolve` both entries are drawn at complementary weights; inside a
 * `fade` one entry is drawn alone, faded toward black, as
 * `IAutoMovieTransition` states.
 */
export interface IAutoMoviePlaybackLayer {
  /** Index of the layer's entry in `sequence.shots`. */
  entry: number;

  /** Id of the entry's shot. */
  shot: string;

  /** Shot-local seconds into the entry's shot. */
  time: number;

  /**
   * Linear compositing weight in `[0, 1]`: the layer's share of a dissolve, or
   * its share against black in a fade.
   */
  weight: number;

  /**
   * Whether the layer's entry is the live one, the entry a placement at the
   * output second shows; false for the outgoing tail of a transition.
   */
  live: boolean;
}
