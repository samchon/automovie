import { IAutoMovieInteractionEvent } from "@automovie/interface";

/**
 * A shot-local interaction event placed on the sequence output clock.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaybackEvent extends IAutoMovieInteractionEvent {
  /** Index into `sequence.shots`. */
  entry: number;

  /** Shot id that owns the source event. */
  shot: string;

  /** Original shot-local event time. */
  shotTime: number;

  /** Global output second after trims and transitions. */
  globalTime: number;
}
