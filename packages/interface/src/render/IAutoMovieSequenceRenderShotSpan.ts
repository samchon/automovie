import type { IAutoMovieTrim } from "../cinematics/IAutoMovieTrim";

/** A shot entry resolved onto the sequence output clock. */
export interface IAutoMovieSequenceRenderShotSpan {
  /** Index into `sequence.shots`. */
  entry: number;

  /** Shot id played by this entry. */
  shot: string;

  /** Inclusive global output second where the entry starts. */
  start: number;

  /**
   * Exclusive global output second where the source excerpt ends; transition
   * overlap may make another entry live earlier.
   */
  end: number;

  /** Output seconds this entry occupies. */
  played: number;

  /** Source shot-local second where playback begins. */
  offset: number;

  /** Trim copied from the sequence entry. */
  trim: IAutoMovieTrim | null;

  /** Source seconds per output second. Absent at the default 1× rate. */
  playbackRate?: number;
}
