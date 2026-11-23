import type { IAutoMovieDialogueMouthTrack } from "./IAutoMovieDialogueMouthTrack";

/** Inputs of sampling one actor's dialogue mouth from a film's mouth track. */
export namespace IAutoMovieSampleDialogueMouth {
  /**
   * A film's mouth track, an actor and a film second.
   *
   * Engine's `sampleAutoMovieDialogueMouth` finds the actor's line whose speech
   * span holds the second's frame, `seconds × fps`, and returns its envelope
   * jaw for that frame with its viseme weights at the fractional frame. A
   * non-finite second throws. Any second may be sampled in any order.
   */
  export interface IProps {
    /** Borrowed mouth track of the film. */
    track: IAutoMovieDialogueMouthTrack;

    /** The actor whose mouth is sampled. */
    actor: string;

    /** Film second; may fall between frames. */
    seconds: number;
  }
}
