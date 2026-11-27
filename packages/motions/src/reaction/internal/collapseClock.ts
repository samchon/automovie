import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanCollapse,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { HumanRefusal } from "../../law/HumanRefusal";
import { knockdown } from "./knockdown";

/**
 * A forward, sideways or in-place collapse's timetable: the body sags for `sag`
 * seconds, its knees meet the floor `knockdown.SEATED` later (the `stroke`), it
 * is down `knockdown.DOWN` after the sag, and it lies `hold` seconds (one by
 * default).
 *
 * @param params The sag and the hold, seconds.
 * @returns The clock with `sag`, `knees`, `stroke` and `down`.
 * @throws {HumanRefusal} When the sag or the hold is negative.
 */
export function collapseClock(
  params: Pick<IAutoMovieMotionHumanCollapse.IParams, "sag" | "hold">,
): IAutoMovieMotionClock {
  const sag: number = params.sag ?? 0;
  const lie: number = params.hold ?? 1;
  const times: readonly (readonly [string, number])[] = [
    ["sag", sag],
    ["hold", lie],
  ];
  for (const [axis, value] of times)
    if (!(value >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis,
        value,
        feasible: {
          kind: "range",
          unit: "s",
          minimum: 0,
          maximum: Number.MAX_VALUE,
        },
        reason: "a collapse's times are non-negative seconds",
        fix: `give a non-negative ${axis}`,
      });
  const kneel: number = sag + knockdown.SEATED;
  const down: number = sag + knockdown.DOWN;
  return AutoMovieMotionClock(down + lie, [
    { name: "sag", seconds: sag },
    { name: "knees", seconds: kneel },
    { name: "stroke", seconds: kneel },
    { name: "down", seconds: down },
  ]);
}
