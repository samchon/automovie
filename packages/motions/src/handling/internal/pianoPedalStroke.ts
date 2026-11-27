import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionHumanPianoPedal } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * The damper pedal's stroke clock: which strokes a pedalling admits, and how
 * far down the pedal is at any instant.
 */
export namespace pianoPedalStroke {
  /*
   * Admit the strokes: at least one, each with `0 < from < at <= release < to <
   * duration`, none starting before the previous one ended.
   */
  export function admit(
    presses: readonly IAutoMovieMotionHumanPianoPedal.IPress[],
    duration: number,
  ): void {
    if (presses.length === 0)
      refuse(
        "duration",
        duration,
        "provide a finite duration and at least one stroke",
      );
    let previous: number = 0;
    for (const { from, at, release, to } of presses) {
      if (
        !(
          0 < from &&
          previous <= from &&
          from < at &&
          at <= release &&
          release < to &&
          to < duration
        )
      )
        refuse(
          "presses",
          from,
          "use disjoint ordered strokes, with time for approach and recovery",
        );
      previous = to;
    }
  }

  /*
   * The pedal's travel fraction at `seconds`: 0 between strokes, 1 from a
   * stroke's `at` to its `release`, and a minimum-jerk share of the press and
   * of the release in between.
   */
  export function travel(
    presses: readonly IAutoMovieMotionHumanPianoPedal.IPress[],
    seconds: number,
  ): number {
    let lo: number = 0;
    let hi: number = presses.length;
    while (lo < hi) {
      const mid: number = Math.floor((lo + hi) / 2);
      if (presses[mid]!.to <= seconds) lo = mid + 1;
      else hi = mid;
    }
    const press: IAutoMovieMotionHumanPianoPedal.IPress | undefined =
      presses[lo];
    if (press === undefined || seconds <= press.from) return 0;
    if (seconds >= press.at && seconds <= press.release) return 1;
    // Read the release from its remaining fraction to keep travel nonnegative.
    const share: number =
      seconds < press.at
        ? (seconds - press.from) / (press.at - press.from)
        : (press.to - seconds) / (press.to - press.release);
    return Math.min(1, AutoMovieEngineMotionSampling.minimumJerkShare(share));
  }
}

/*
 * Report a stroke clock the author can correct.
 */
function refuse(axis: string, value: number, fix: string): never {
  throw new AutoMovieMotionHumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason: "the right-foot damper action cannot be placed",
    fix,
  });
}
