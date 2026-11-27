import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanTrick,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * A trick ride's schedule: each figure's transfer then its hold, one after
 * another, the ride ending back in the seat; at a second the current figure and
 * the minimum-jerk share of its transfer, and a `kind:index` cue where each
 * transfer ends.
 *
 * @param figures The figures in order.
 * @returns The schedule.
 * @throws {HumanRefusal} When there is no figure, the last is not a seat, a
 *   transfer has no length, a hold is negative, or a pickup names no prop.
 */
export function humanTrickSchedule(
  figures: readonly IAutoMovieMotionHumanTrick.IFigure[],
): humanTrickSchedule.ISchedule {
  if (figures.length === 0 || figures[figures.length - 1]!.kind !== "seat")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "figures",
      value: figures.map(
        (f: IAutoMovieMotionHumanTrick.IFigure): string => f.kind,
      ),
      feasible: null,
      reason:
        "trick riding holds at least one figure and ends back in the seat",
      fix: "end on a seat figure",
    });
  figures.forEach(
    (figure: IAutoMovieMotionHumanTrick.IFigure, i: number): void => {
      HumanBound.above(`figures.${i}.transfer`, figure.transfer, 0, "s");
      HumanBound.least(`figures.${i}.seconds`, figure.hold, 0, "s");
      if (figure.kind === "pickup" && figure.object === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: `figures.${i}.object`,
          value: undefined,
          feasible: null,
          reason: "a pickup takes a prop from the ground, and none is named",
          fix: "name the prop the pickup takes",
        });
    },
  );
  const starts: number[] = [];
  let clock: number = 0;
  for (const figure of figures) {
    starts.push(clock);
    clock += figure.transfer + figure.hold;
  }
  const duration: number = clock;
  return {
    starts,
    duration,
    events: figures.map(
      (
        figure: IAutoMovieMotionHumanTrick.IFigure,
        i: number,
      ): IAutoMovieMotionEvent => ({
        name: `${figure.kind}:${i}`,
        share: (starts[i]! + figure.transfer) / duration,
      }),
    ),
    at: (t: number): humanTrickSchedule.IAt => {
      let index: number = 0;
      while (index + 1 < figures.length && t >= starts[index + 1]!) ++index;
      return {
        index,
        share: minimumJerk.share(
          Math.min(1, (t - starts[index]!) / figures[index]!.transfer),
        ),
      };
    },
  };
}

/** The trick ride's schedule. */
export namespace humanTrickSchedule {
  /** A second's figure and its transfer's share. */
  export interface IAt {
    /** The current figure's index. */
    index: number;

    /** The minimum-jerk share of its transfer, 0 to 1. */
    share: number;
  }

  /** The figures' starts, the ride's length, its cues and its reader. */
  export interface ISchedule {
    /** Each figure's start, seconds. */
    starts: number[];

    /** The ride's seconds. */
    duration: number;

    /** Each figure's cue where its transfer ends. */
    events: IAutoMovieMotionEvent[];

    /**
     * The figure and share at a second.
     *
     * @param t Seconds into the ride.
     * @returns The figure and its transfer's share.
     */
    at(t: number): IAt;
  }
}
