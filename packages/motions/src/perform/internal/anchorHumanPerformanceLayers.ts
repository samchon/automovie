import type {
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceState,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";

/*
 * Give each anchored layer its instants before anything is placed: a layer
 * whose window waits for no action (a film second or a cue track's instant at
 * both ends) has them already, so actions can be synced to them, and the
 * resolver reads them as one more cue track (`self.layered`); any other
 * anchored layer is listed with none yet.
 * Parameter self: The performance's state, whose `layered` tracks are set.
 * Parameter input: The performance's input.
 * When a layer anchor is already the name of another
 * layer or of a cue track.
 */
export function anchorHumanPerformanceLayers(
  self: IAutoMovieMotionHumanPerformanceState,
  input: IAutoMovieMotionHumanPerformance.IInput,
): void {
  for (const [subject, layers] of Object.entries(input.layers ?? {}))
    for (const scheduled of layers) {
      if ("apply" in scheduled || scheduled.anchor === undefined) continue;
      if (
        self.layered.has(scheduled.anchor) ||
        self.cues[scheduled.anchor] !== undefined
      )
        throw new HumanRefusal({
          kind: "parameter",
          performer: subject,
          axis: "layers",
          value: scheduled.anchor,
          reason: `the layer anchor ${scheduled.anchor} is already the name of another layer or of a cue track (in use: ${[...self.layered.keys(), ...Object.keys(self.cues)].join(", ")})`,
          fix: "give every anchored layer a name of its own, different from every cue track's",
        });
      const early = (
        at: AutoMovieMotionHumanScheduledInstant | undefined,
        absent: number | undefined,
      ): number | undefined =>
        at === undefined
          ? absent
          : typeof at === "number" || self.cues[at.of] !== undefined
            ? HumanPerformanceLayers.instant(self, at)
            : undefined;
      const from: number | undefined = early(scheduled.from, 0);
      const to: number | undefined = early(scheduled.to, undefined);
      self.layered.set(
        scheduled.anchor,
        from === undefined || to === undefined
          ? []
          : HumanPerformanceLayers.instants(from, to, scheduled.fade),
      );
    }
}
