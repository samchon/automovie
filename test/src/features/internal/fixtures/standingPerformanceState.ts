import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { HumanPerformanceState } from "@automovie/motions/internal";

import { humanFixtureBody } from "./humanFixtureBody";

/**
 * A resolved performance state for unit tests of a function that reads the
 * state's people, segments or intents: the stored average man standing at the
 * origin facing `+Z` for two placed one-second stands, among the given props.
 *
 * The state is resolved afresh on every call and shared with no one, so a test
 * may replace any of its records.
 *
 * @param props The props, none by default.
 * @returns The state and the input it was resolved from.
 */
export async function standingPerformanceState(
  props: IAutoMovieMotionHumanProp[] = [],
): Promise<standingPerformanceState.IResult> {
  const input: IAutoMovieMotionHumanPerformance.IInput = {
    seed: "standing",
    performers: [
      {
        subject: "actor",
        body: await humanFixtureBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props,
    composition: HumanChain.subject("actor")
      .stand({ hold: 1 })
      .stand({ hold: 1 }).node,
  };
  return { input, state: new HumanPerformanceState(input, "staged") };
}

/** Companion types of {@link standingPerformanceState}. */
export namespace standingPerformanceState {
  /** The resolved state and its input. */
  export interface IResult {
    /** The input. */
    input: IAutoMovieMotionHumanPerformance.IInput;

    /** The resolved state. */
    state: HumanPerformanceState;
  }
}
