import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPour,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * The pour's stage clock: the five authored stages in order, each 0.2 to 3
 * seconds and at most 10 seconds in all, scaled by the performance's tempo. The
 * tilt and lip gap are admitted with it, before the plan reads them.
 *
 * @param params The pour's authored stages, tilt and gap.
 * @param tempo The performance's time scale, positive.
 * @returns The clock of the stages' start events, seconds.
 * @throws {HumanRefusal} For a stage, a total, a tempo, a tilt or a gap out of
 *   its range.
 */
export function pourClock(
  params: IAutoMovieMotionHumanPour.IParams,
  tempo: number,
): IAutoMovieMotionClock {
  const { timing, gap, tilt } = params;
  const phases: IPourClockPhase[] = [
    { name: "approachStart", seconds: timing.approach },
    { name: "tipStart", seconds: timing.tip },
    { name: "flowStart", seconds: timing.flow },
    { name: "flowEnd", seconds: timing.right },
    { name: "retreatStart", seconds: timing.retreat },
  ];
  let duration: number = 0;
  for (const phase of phases)
    duration +=
      phase.seconds >= 0.2 && phase.seconds <= 3 ? phase.seconds : NaN;
  if (!(duration <= 10 && tempo > 0 && duration * tempo <= 10))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "timing",
      value: duration,
      reason:
        "the five stages need 0.2 to 3 seconds each and at most 10 seconds in all, including tempo scaling",
      fix: "shorten or lengthen the affected stage lengths",
    });
  if (!(tilt >= 35 && tilt <= 90 && gap >= 0.04 && gap <= 0.18))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "tilt/gap",
      value: params.tilt,
      reason:
        "the pour needs a 35 to 90 degree tilt and a 0.04 to 0.18 metre gap",
      fix: "author a tilt and lip clearance in those ranges",
    });
  for (const phase of phases) phase.seconds *= tempo;
  return AutoMovieMotionClock.sequence(phases);
}

/** A pour stage's start event and authored length, seconds. */
type IPourClockPhase = { name: string; seconds: number };
