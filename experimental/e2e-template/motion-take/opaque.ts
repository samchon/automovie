import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";

import type { IMotionTakeSource } from "../../src/executable/motionTake/IMotionTakeSource";
import { createMotionTakeSource as original } from "./source";

/** Add an explicitly authored site reader without declaring its binding. */
export function createMotionTakeSource(): IMotionTakeSource {
  const source: IMotionTakeSource = original();
  const input: IAutoMovieMotionHumanPerformance.IInput =
    source.human["staged-catch"]!;
  return {
    ...source,
    human: {
      "staged-catch": {
        ...input,
        props: input.props!.map(
          (prop: IAutoMovieMotionHumanProp): IAutoMovieMotionHumanProp =>
            prop.subject === "door"
              ? { ...prop, articulateSite: (): undefined => undefined }
              : prop,
        ),
      },
    },
  };
}
