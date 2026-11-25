import type { IAutoMovieMotionClock } from "@automovie/interface";

/** The alternatives of `BowViolinDirection`'s site. */
type BowViolinDirection = "up" | "down";

/**
 * Prepare a bow stroke's schedule on its clock: the hair on the sounding point
 * slides between 18% and 42% of the playable hair through `contact` to `lift`,
 * frog-to-tip for a down-bow and tip-to-frog for an up-bow (provisional), and
 * stands a clearance off the string before `ready`, lowers to it through
 * `contact` and rises back through `end`.
 *
 * @param clock The stroke's clock, with `approach`, `ready`, `contact` and
 *   `lift` phases.
 * @param direction The bow's direction; down when absent.
 * @param clearance The height off the string before and after the stroke,
 *   metres.
 * @returns The share and the lift at seconds since the action's start.
 */
export function bowViolinStroke(
  clock: IAutoMovieMotionClock,
  direction: BowViolinDirection | undefined,
  clearance: number,
): (seconds: number) => bowViolinStroke.IStroke {
  const from: number = bowViolinStroke.from(direction);
  const to: number = direction === "up" ? 0.18 : 0.42;
  return (seconds: number): bowViolinStroke.IStroke => ({
    share: from + (to - from) * clock.progress("contact", "lift", seconds),
    lift:
      clearance *
      (1 -
        clock.progress("ready", "contact", seconds) +
        clock.progress("lift", "end", seconds)),
  });
}

/** The stroke's state and hair shares. */
export namespace bowViolinStroke {
  /** The hair on the string at one second. */
  export interface IStroke {
    /** The hair's share from frog to tip on the sounding point. */
    share: number;

    /** The hair's height off the string, metres. */
    lift: number;
  }

  /**
   * Where the hair meets the string as the stroke starts.
   *
   * @param direction The bow's direction; down when absent.
   * @returns The share from frog to tip: 42% for an up-bow, 18% for a down-bow.
   */
  export function from(direction: BowViolinDirection | undefined): number {
    return direction === "up" ? 0.42 : 0.18;
  }
}
