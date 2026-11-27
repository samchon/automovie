import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanDanceFootKey,
} from "@automovie/interface";

/*
 * A dance's flights: the spans where neither foot bears between its keys, from
 * the end of the borne spans covered so far to the next borne key, each bearing
 * key bearing from its arrival to its leave, cut at the dance's end.
 * Parameter keys: Each foot's keys.
 * Parameter end: The dance's last second.
 * Returns: The flights, in order.
 */
export function tapDanceFlights(
  keys: Record<AutoMovieHumanSide, readonly tapDanceFlights.IKey[]>,
  end: number,
): tapDanceFlights.IFlight[] {
  const spans = (
    list: readonly tapDanceFlights.IKey[],
  ): tapDanceFlights.IFlight[] =>
    list
      .filter((k: tapDanceFlights.IKey): boolean => k.bears)
      .map(
        (k: tapDanceFlights.IKey): tapDanceFlights.IFlight => ({
          from: k.at,
          to: Math.min(end, k.leave),
        }),
      );
  const borne: tapDanceFlights.IFlight[] = [
    ...spans(keys.left),
    ...spans(keys.right),
  ].sort(
    (a: tapDanceFlights.IFlight, b: tapDanceFlights.IFlight): number =>
      a.from - b.from,
  );
  const flights: tapDanceFlights.IFlight[] = [];
  let covered: number = 0;
  for (const span of borne) {
    if (span.from > covered + 1e-9)
      flights.push({ from: covered, to: span.from });
    covered = Math.max(covered, span.to);
  }
  return flights;
}

/*
 * A dance's flight and the hips' rise on it.
 */
export namespace tapDanceFlights {
  /*
   * What a flight reads of a foot key.
   */
  export type IKey = Pick<
    IAutoMovieMotionHumanDanceFootKey,
    "at" | "leave" | "bears"
  >;

  /*
   * A span with no foot bearing.
   */
  export interface IFlight {
    /*
     * When the last bearing foot leaves.
     */
    from: number;

    /*
     * When the next lands.
     */
    to: number;
  }

  /*
   * The hips' rise on the ballistic arc of the flight a second is in, `4 (g T²
   * / 8) u (1 − u)` over a flight of `T` seconds: none outside every flight.
   * Parameter flights: The flights.
   * Parameter t: The second.
   * Returns: Metres.
   */
  export function hop(flights: readonly IFlight[], t: number): number {
    for (const f of flights)
      if (t > f.from && t < f.to) {
        const u: number = (t - f.from) / (f.to - f.from);
        const span: number = f.to - f.from;
        return (
          4 * ((AutoMovieGravity.STANDARD * span * span) / 8) * u * (1 - u)
        );
      }
    return 0;
  }
}
