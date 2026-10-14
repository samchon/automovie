import type { IAutoMovieActionCall, IAutoMovieActionTarget } from "@automovie/interface";

/** Construct the existing knightA one-second walk with its supplied target and default zero start. The positional unit derives target-kind, world-position and clock expectations from its authored data and owns all positive/negative/boundary assertions; this unchanged draft constructor supplies no oracle, admission rule, host or new case. */
export function createFilmPositionalLocomote(
    to: IAutoMovieActionTarget,
    start: number = 0,
  ): IAutoMovieActionCall { return ({
    verb: "locomote",
    actor: "knightA",
    start,
    duration: 1,
    gait: "walk",
    to,
  }); }
