import { AutoMovieAir, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanReaction,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * What a person reacts to without being touched: a gunshot's or a cannon's
 * report reaches a listener when its sound has crossed the distance between
 * them, so a startle synced to it begins that much after the shot.
 *
 * The delay is the distance over the speed of sound of the engine's one air
 * (`AutoMovieAir.SOUND`, the ICAO Standard Atmosphere at sea level). The report
 * is a cue instant, not a hit: it delivers no impulse, and the reaction's own
 * latency is the sync's to add (`latency: "reaction"`).
 */
export namespace HumanReaction {
  /**
   * The film second a shot's report reaches a listener.
   *
   * @param shot Where and when the shot is fired, world metres and film
   *   seconds.
   * @param listener Where the listener hears it, world metres.
   * @returns The film second the sound arrives.
   */
  export function report(
    shot: IAutoMovieMotionHumanReaction.IReportShot,
    listener: IAutoMovieVector3,
  ): number {
    return (
      shot.seconds +
      Vector3.length(Vector3.subtract(listener, shot.point)) /
        AutoMovieAir.SOUND
    );
  }
}
