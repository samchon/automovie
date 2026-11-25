import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanHandrimStroke,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A handrim stroke's phases: the hand approaches the rim, pushes it to the
 * release and recovers, each a positive span; `catch` cues the rim's grasp and
 * `release` the end of the push.
 *
 * @param params The approach, push and recovery seconds.
 * @returns The release, the stroke's seconds and its cues.
 * @throws {HumanRefusal} When a phase is not positive, or the phases do not
 *   give distinct finite instants.
 */
export function humanHandrimStrokePhases(
  params: Pick<
    IAutoMovieMotionHumanHandrimStroke,
    "approach" | "push" | "recovery"
  >,
): humanHandrimStrokePhases.IPhases {
  const { approach, push, recovery } = params;
  const release: number = approach + push;
  const duration: number = release + recovery;
  for (const [axis, value] of Object.entries({ approach, push, recovery }))
    if (!(value > 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis,
        value,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: null,
          unit: "s",
          open: "minimum",
        },
        reason: "the phase needs positive, finite seconds",
        fix: "give a positive duration in seconds for this phase",
      });
  if (!(approach < release && release < duration))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: duration,
      feasible: null,
      reason: "the phase durations do not produce distinct finite times",
      fix: "give positive phase seconds of comparable scale",
    });
  return {
    release,
    duration,
    events: [
      { name: "catch", share: approach / duration },
      { name: "release", share: release / duration },
    ],
  };
}

/** The handrim stroke's phases. */
export namespace humanHandrimStrokePhases {
  /** The stroke's instants and cues. */
  export interface IPhases {
    /** The push's end, seconds. */
    release: number;

    /** The stroke's seconds. */
    duration: number;

    /** The `catch` and `release` cues. */
    events: IAutoMovieMotionEvent[];
  }
}
