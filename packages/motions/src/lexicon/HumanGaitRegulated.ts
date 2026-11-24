import type {
  IAutoMovieMotionHumanDrillRegulation,
  IAutoMovieMotionHumanGait,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HUMAN_DRILL_CADENCES } from "./HUMAN_DRILL_CADENCES";
import { HumanGait } from "./HumanGait";

/** The record of `IRegulatedResult`'s site. */
type IRegulatedResult = {
  cadence: number;
  step: number;
};

/**
 * A march's cadence and step in metres: its regulation's time and pace, or TC
 * 3-21.5's quick time.
 */
export function HumanGaitRegulated(
  params: IAutoMovieMotionHumanGait.IMarch,
): IRegulatedResult {
  if (params.regulation === undefined)
    return { cadence: HumanGait.MARCH.cadence, step: HumanGait.MARCH.step };
  const row: IAutoMovieMotionHumanDrillRegulation =
    HUMAN_DRILL_CADENCES[params.regulation];
  const names: string[] = Object.keys(row.times);
  const time: string = params.time ?? names[0] ?? "";
  const cadence: number | undefined = row.times[time];
  if (cadence === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "time",
      value: time,
      feasible: { kind: "alternatives", values: names },
      reason: `the ${params.regulation} regulation has no ${time} time`,
      fix: "march at one of the regulation's times",
    });
  return { cadence, step: row.pace };
}
