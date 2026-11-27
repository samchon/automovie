import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { HumanArmSwing } from "../../posture/internal/HumanArmSwing";

/**
 * A take's carriage.
 *
 * @param body The body.
 * @param events The take's named instants, seconds.
 * @param duration The take's seconds.
 * @param posture The take's posture before the carriage.
 * @param resolution Optional same-person FK loan for the actual synchronous
 *   phase observations.
 * @param projection Optional genuine same-body ROM loan, never retained in the
 *   numeric carriage.
 * @returns Degrees of abduction per arm.
 */
export function walkCarriage(
  body: IAutoMovieMotionHumanBody,
  events: readonly IOfEventsItem[],
  duration: number,
  posture: IAutoMovieMotionHumanActionPlan["posture"],
  resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
): Record<AutoMovieHumanSide, number> {
  // The spans: the start to the first left heel strike, each stride, and
  // the last strike to the end.
  const bounds: number[] = [
    0,
    ...events
      .filter((e: IOfBoundsE): boolean => /^leftHeelStrike/.test(e.name))
      .map((e: IOfBoundsE2): number => e.seconds)
      .filter((s: number): boolean => s > 0 && s < duration),
    duration,
  ];
  const times: number[] = [];
  for (let i: number = 1; i < bounds.length; i++) {
    const a: number = bounds[i - 1]!;
    const b: number = bounds[i]!;
    for (let k: number = 0; k < HumanArmSwing.PHASES; k++)
      times.push(a + ((b - a) * k) / HumanArmSwing.PHASES);
  }
  return HumanArmSwing.carriage(
    body,
    times,
    posture,
    ["left", "right"],
    resolution,
    projection,
  );
}

/** The record of `IOfBoundsE2`'s site. */
type IOfBoundsE2 = { seconds: number };

/** The record of `IOfBoundsE`'s site. */
type IOfBoundsE = { name: string };

/** The record of `IOfEventsItem`'s site. */
type IOfEventsItem = { name: string; seconds: number };
