import type { IAutoMovieMotionHumanHeldWork } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Admit a held work before any hand moves: it must drive an articulation, move
 * the prop or take another prop, over a finite positive duration.
 *
 * Refuses on `drive` when it does none of the three (an empty drive list counts
 * as none), and on `duration` otherwise.
 */
export function admitHeldWork(
  params: Pick<
    IAutoMovieMotionHumanHeldWork.IParams,
    "drive" | "at" | "take" | "duration"
  >,
): void {
  if (
    (params.drive === undefined || params.drive.length === 0) &&
    params.at === undefined &&
    params.take === undefined
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "drive",
      value: "absent",
      feasible: { kind: "alternatives", values: ["drive", "at", "take"] },
      reason:
        "a held work drives an articulation, moves the prop or takes a prop",
      fix: "give `drive`, `at` or `take`",
    });
  if (!(params.duration > 0))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: params.duration,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: Number.MAX_VALUE,
        unit: "s",
      },
      reason: "a held work needs a finite positive duration",
      fix: "give the work's duration in seconds",
    });
}
