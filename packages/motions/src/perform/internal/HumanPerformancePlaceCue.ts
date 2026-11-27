import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieScheduleCue,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * An action's reader of the performance's cue tracks
 * (`HumanPerformancePlace.place`).
 * Parameter self: The performance's state.
 * Parameter named: The parameter through which the reading action named an id.
 * Returns: The reader of a cue track by name.
 * When the performance has no cue track of a read name.
 */
export function HumanPerformancePlaceCue(
  self: IAutoMovieMotionHumanPerformanceState,
  named: (id: string, otherwise: string) => string,
): (track: string) => readonly IAutoMovieScheduleCue[] {
  return (track: string): readonly IAutoMovieScheduleCue[] => {
    const cues: readonly IAutoMovieScheduleCue[] | undefined = self.cues[track];
    if (cues === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: named(track, "cue"),
        value: track,
        feasible: {
          kind: "alternatives",
          values: Object.keys(self.cues),
        },
        reason: `the performance has no cue track named ${track}`,
        fix: "name one of the performance's cue tracks, or give the performance that track in its cues",
      });
    return cues;
  };
}
