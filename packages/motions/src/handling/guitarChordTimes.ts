import type { IAutoMovieMotionHumanGuitarChord } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The instants a strummed chord is built on: the hand prepares halfway to the
 * fretting stop, and the sweep crosses the strings at its first and second
 * thirds.
 *
 * Refuses unordered stop, sweep and release times, instants too close to stay
 * distinct as shares of the duration, and any direction but down or up.
 */
export function guitarChordTimes(
  params: Pick<
    IAutoMovieMotionHumanGuitarChord,
    | "duration"
    | "stopAt"
    | "sweepStartAt"
    | "sweepEndAt"
    | "releaseAt"
    | "direction"
  >,
): guitarChordTimes.ITimes {
  const { duration, stopAt, sweepStartAt, sweepEndAt, releaseAt, direction } =
    params;
  if (
    !(
      0 < stopAt &&
      stopAt < sweepStartAt &&
      sweepStartAt < sweepEndAt &&
      sweepEndAt < releaseAt &&
      releaseAt < duration
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "stopAt",
      value: [stopAt, sweepStartAt, sweepEndAt, releaseAt, duration],
      reason: "the fretting, sweep and release need ordered finite times",
      fix: "give 0 < stopAt < sweepStartAt < sweepEndAt < releaseAt < duration",
    });
  const prep: number = stopAt / 2;
  const sweepDuration: number = sweepEndAt - sweepStartAt;
  const firstAt: number = sweepStartAt + sweepDuration / 3;
  const secondAt: number = sweepEndAt - sweepDuration / 3;
  if (
    !(
      prep > 0 &&
      sweepStartAt < firstAt &&
      firstAt < secondAt &&
      secondAt < sweepEndAt &&
      sweepStartAt / duration < firstAt / duration &&
      firstAt / duration < secondAt / duration &&
      secondAt / duration < sweepEndAt / duration
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "sweepStartAt",
      value: [stopAt, sweepStartAt, sweepEndAt, duration],
      reason:
        "the preparation and both crossings need distinct representable times",
      fix: "give the hand preparation and sweep wider time intervals",
    });
  if (direction !== "down" && direction !== "up")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "direction",
      value: direction,
      reason: "the chord takes one directed sweep",
      fix: "choose down or up",
    });
  return { prep, firstAt, secondAt };
}

/** Timing shared by the guitar law's fretting and strumming hands. */
export namespace guitarChordTimes {
  /** The chord's derived instants, seconds from its start. */
  export interface ITimes {
    /** When the hand has prepared, halfway to the fretting stop. */
    prep: number;

    /** When the sweep crosses the strings first, a third of the way. */
    firstAt: number;

    /** When the sweep crosses the strings again, two thirds of the way. */
    secondAt: number;
  }
}
