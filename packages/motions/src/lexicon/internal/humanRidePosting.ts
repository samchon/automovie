import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A rising trot's posting: the seat lifts off the saddle along the mount's own
 * up by `post · sin²(π s)` over each stride's progress `s` and comes back once
 * a stride, the stride read from a stride time or between the instants of a cue
 * track (the mount's own strides); outside a cue track's strides, and without a
 * rising, the seat stays down.
 * Parameter rising: The stride time, the cue track's sorted strides, or none.
 * Parameter start: The ride's film start, seconds.
 * Parameter post: The posting's height, metres.
 * Returns: The seat's lift at a second of the ride.
 * When the stride time has no length, or the cue track
 * holds fewer than two instants.
 */
export function humanRidePosting(
  rising: humanRidePosting.Rising | undefined,
  start: number,
  post: number,
): humanRidePosting.IPosting {
  if (rising?.kind === "period")
    HumanBound.above("rising", rising.seconds, 0, "s");
  if (rising?.kind === "strides" && rising.strides.length < 2)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "rising",
      value: rising.cue,
      feasible: null,
      reason: `the cue track ${rising.cue} holds ${rising.strides.length} instants, and a stride lies between two`,
      fix: "give a cue track with the mount's strides, or the stride time in seconds",
    });
  const stride = (at: number): number | undefined => {
    if (rising === undefined) return undefined;
    if (rising.kind === "period") return (at / rising.seconds) % 1;
    const film: number = start + at;
    const strides: readonly number[] = rising.strides;
    for (let i: number = 0; i + 1 < strides.length; ++i)
      if (film >= strides[i]! && film < strides[i + 1]!)
        return (film - strides[i]!) / (strides[i + 1]! - strides[i]!);
    return undefined;
  };
  return {
    stride,
    lift: (at: number): number => {
      const through: number | undefined = stride(at);
      return through === undefined
        ? 0
        : post * Math.sin(Math.PI * through) ** 2;
    },
  };
}

/*
 * The rising trot's posting.
 */
export namespace humanRidePosting {
  /*
   * How the strides are given.
   */
  export type Rising =
    | {
        /*
         * By a stride time.
         */
        kind: "period";

        /*
         * Seconds per stride.
         */
        seconds: number;
      }
    | {
        /*
         * Between the instants of a cue track.
         */
        kind: "strides";

        /*
         * The cue track's name.
         */
        cue: string;

        /*
         * Its instants, film seconds, sorted.
         */
        strides: readonly number[];
      };

  /*
   * The posting's readers.
   */
  export interface IPosting {
    /*
     * How far through a stride a second of the ride is.
     * Parameter at: Ride seconds.
     * Returns: 0 to 1; none without a stride there.
     */
    stride(at: number): number | undefined;

    /*
     * The seat's lift off the saddle at a second.
     * Parameter at: Ride seconds.
     * Returns: Metres.
     */
    lift(at: number): number;
  }
}
