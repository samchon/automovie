import type { IAutoMovieMotionHumanPerformanceState } from "@automovie/interface";

/*
 * Select a prop's displayed grip, second hand, rest and flight cutoff at a film
 * second once from its sorted grip spans (`HumanPerformanceHold`): the latest
 * grip still holding carries it, a performer's other hand on a prop that
 * performer already holds steadies it, and with none holding, the one released
 * last left it.
 * Parameter grips: The prop's grip spans, sorted.
 * Parameter seconds: Film seconds.
 * Parameter takeSocket: Whether a socket grip closing exactly at the second takes
 * the prop, as a supplied pose used for aiming may.
 * Returns: The carriers and the last closure before the second.
 */
export function HumanPerformanceCustody(
  grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
  seconds: number,
  takeSocket: boolean,
): HumanPerformanceCustody.ICustody {
  // The latest grip still holding carries it; with none holding, the one released last left it.
  let active: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
  let steady: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
  let released: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
  let since: number = -Infinity;
  for (const g of grips) {
    // At closure the world frame comes from the previous carrier. A supplied
    // pose used for aiming can take the authored socket chain at that instant.
    const from: number = g.from;
    if (
      from > seconds ||
      (from === seconds &&
        g.bone === undefined &&
        (g.mount === undefined || !takeSocket))
    )
      continue;
    if (from < seconds) since = Math.max(since, from);
    if (seconds <= g.to) {
      // A performer's other hand on a prop that performer already holds
      // steadies it and does not take it over: a camera's far end held
      // with the right hand on the grip.
      const steadies: boolean =
        active !== undefined &&
        active.bone === undefined &&
        active.mount === undefined &&
        g.bone === undefined &&
        g.mount === undefined &&
        active.subject === g.subject &&
        active.side !== g.side;
      if (!steadies) {
        active = g;
        steady = undefined;
      } else steady = g;
    } else if (released === undefined || g.to >= released.to) released = g;
  }
  return { active, steady, released, since };
}

/*
 * Companion types of HumanPerformanceCustody.
 */
export namespace HumanPerformanceCustody {
  /*
   * The carriers picked by the frame's usual grip and flight precedence.
   */
  export interface ICustody {
    /*
     * The latest carrier that still holds the prop.
     */
    active: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    /*
     * The other hand when it steadies the active carrier's grip.
     */
    steady: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    /*
     * The last carrier to let go, whose final frame supplies unlaunched rest.
     */
    released: IAutoMovieMotionHumanPerformanceState.IGrip | undefined;
    /*
     * Film second of the last closure before the query, which overrides older
     * flights.
     */
    since: number;
  }
}
