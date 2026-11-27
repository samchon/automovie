import { AutoMovieEngineMotionSampling } from "@automovie/engine";

/**
 * The hands' grip on a ride's implement over an overlay (`HumanHoldHandles`,
 * `HumanLeadHorse`, `HumanTendHorse`): the hands acquire it over the
 * transition, hold it, and release it over a last transition, the fingers'
 * closure a minimum-jerk share of the nearer transition's progress.
 *
 * @param transition The acquire and release seconds.
 * @param seconds The overlay's seconds.
 * @returns The grip's start and end shares and its closure at a second.
 */
export function humanRideGripTiming(
  transition: number,
  seconds: number,
): humanRideGripTiming.ITiming {
  return {
    on: transition / seconds,
    off: 1 - transition / seconds,
    closure: (time: number): number =>
      AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, time / transition, (seconds - time) / transition),
      ),
  };
}

/** The ride grip's timing. */
export namespace humanRideGripTiming {
  /** The grip's shares and closure. */
  export interface ITiming {
    /** The share the grip is acquired at. */
    on: number;

    /** The share it is released from. */
    off: number;

    /**
     * The fingers' closure at a second.
     *
     * @param time Seconds into the overlay, clamped by the caller.
     * @returns The closure's share, 0 open to 1 closed.
     */
    closure(time: number): number;
  }
}
