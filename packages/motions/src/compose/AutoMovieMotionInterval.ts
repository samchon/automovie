import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionClock } from "@automovie/interface";

/** Named clock intervals resolved once for repeated progress reads. */
export namespace AutoMovieMotionInterval {
  /** Uniform progress with the clock's original short-window step. */
  export function linear(from: number, to: number, seconds: number): number {
    if (to - from < 1e-12) return seconds >= to ? 1 : 0;
    return Math.min(1, Math.max(0, (seconds - from) / (to - from)));
  }

  /**
   * Minimum-jerk progress over a window given by its two seconds.
   *
   * @param from The window's opening second.
   * @param to The window's closing second.
   * @param seconds The second read, on the same clock.
   * @returns The Flash and Hogan share in [0,1]: zero before the window, one
   *   after it.
   */
  export function progress(from: number, to: number, seconds: number): number {
    return minimumJerk.share(linear(from, to, seconds));
  }

  /**
   * Resolve a fixed named interval before its repeated reads.
   *
   * @param clock The unchanged action clock whose own at method admits both
   *   names.
   * @param from The opening name.
   * @param to The closing name.
   * @returns Uniform and minimum-jerk readers at actual action-local seconds.
   * @throws {Error} Whatever the clock throws for an unknown name.
   */
  export function prepare(
    clock: Pick<IAutoMovieMotionClock, "at">,
    from: string,
    to: string,
  ): IPrepared {
    const opening: number = clock.at(from);
    const closing: number = clock.at(to);
    const read: (seconds: number) => number = (seconds: number): number =>
      linear(opening, closing, seconds);
    return {
      linear: read,
      progress: (seconds: number): number => minimumJerk.share(read(seconds)),
    };
  }

  /** Fixed-interval scalar readers with the clock's existing rules. */
  export interface IPrepared {
    /** Uniform progress at action-local seconds over this fixed interval. */
    linear(seconds: number): number;

    /** Flash and Hogan minimum-jerk progress at action-local seconds. */
    progress(seconds: number): number;
  }
}
