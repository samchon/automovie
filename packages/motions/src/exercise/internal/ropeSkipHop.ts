import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanRopeSkip,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A rope hop's timetable and lift: the flight (0.26 s by default, the rope's
 * simultaneous-foot crossing 0.13 s after takeoff in Silva and Pellegrini 2009
 * placed at the apex) centred in the period (1.7 Hz by default). The root rises
 * on the ballistic parabola `g t (flight - t) / 2` in the air and, on the
 * ground, dips on a cubic over the compression (at most 0.18 s), reaching its
 * deepest a third of the way from takeoff or landing, with the launch speed `g
 * flight / 2` at takeoff.
 * Parameter params: The flight and the period, seconds.
 * Parameter start: The action's film start, seconds.
 * Returns: The hop's times, cues and lift.
 * When the flight lies outside 0.12 to 0.36 s, the
 * period does not exceed it, or the phases do not keep distinct instants on
 * the action and film clocks.
 */
export function ropeSkipHop(
  params: Pick<
    IAutoMovieMotionHumanRopeSkip.IParams,
    "flightSeconds" | "periodSeconds"
  >,
  start: number,
): ropeSkipHop.IHop {
  const flight: number = HumanBound.within(
    "flightSeconds",
    params.flightSeconds ?? 0.26,
    0.12,
    0.36,
    "s",
  );
  const duration: number = HumanBound.above(
    "periodSeconds",
    params.periodSeconds ?? 1 / 1.7,
    flight,
    "s",
  );
  const takeoff: number = (duration - flight) / 2;
  const under: number = takeoff + flight / 2;
  const landed: number = takeoff + flight;
  // A slow cadence adds still support time. The cubic reaches maximum
  // compression one third of this interval from takeoff or landing.
  const compression: number = Math.min(takeoff, 0.18);
  const times: readonly number[] = [
    0,
    takeoff - compression / 3,
    takeoff,
    under - flight / 4,
    under,
    under + flight / 4,
    landed,
    landed + compression / 3,
    duration,
  ];
  const shares: readonly number[] = times.map(
    (time: number): number => time / duration,
  );
  const film: readonly number[] = shares.map(
    (share: number): number => start + share * duration,
  );
  // The event reader reconstructs film time from the share. The pose reader
  // then subtracts the start to recover time within the action.
  if (
    !ordered(times) ||
    !ordered(shares) ||
    !ordered(film) ||
    !ordered(film.map((time: number): number => time - start))
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "periodSeconds",
      value: { periodSeconds: duration, flightSeconds: flight, start },
      reason:
        "the skip phases need distinct times on the action and film clocks",
      fix: "use a period closer to the default or place the skip earlier",
    });
  const gravity: number = AutoMovieGravity.STANDARD;
  const launch: number = (gravity * flight) / 2;
  return {
    duration,
    flight,
    takeoff,
    under,
    landed,
    events: [
      { name: "ropeOverhead", share: 0 },
      { name: "takeoff", share: takeoff / duration },
      { name: "ropeUnder", share: under / duration },
      { name: "landed", share: landed / duration },
    ],
    lift: (seconds: number): number => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      if (t > takeoff && t < landed)
        return (gravity * (t - takeoff) * (flight - (t - takeoff))) / 2;
      // The negative cubic has the launch speed at takeoff and none when
      // upright; read in reverse it is the matching landing absorption.
      const ground: number = Math.min(
        1,
        (t <= takeoff ? takeoff - t : t - landed) / compression,
      );
      return -launch * compression * ground * (1 - ground) ** 2;
    },
  };
}

/*
 * The rope hop.
 */
export namespace ropeSkipHop {
  /*
   * The hop's phases, cues and lift.
   */
  export interface IHop {
    /*
     * The period, seconds.
     */
    duration: number;

    /*
     * The flight, seconds.
     */
    flight: number;

    /*
     * The takeoff, seconds.
     */
    takeoff: number;

    /*
     * The rope passing under the feet at the apex, seconds.
     */
    under: number;

    /*
     * The landing, seconds.
     */
    landed: number;

    /*
     * The rope's cues.
     */
    events: IAutoMovieMotionEvent[];

    /*
     * The root's rise above the stance at a second.
     * Parameter seconds: Action seconds.
     * Returns: Metres; negative while the legs compress.
     */
    lift(seconds: number): number;
  }
}

/*
 * Check that every phase sample occupies a distinct finite clock instant.
 */
function ordered(times: readonly number[]): boolean {
  return times.every(
    (time: number, i: number): boolean => i === 0 || times[i - 1]! < time,
  );
}
