import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanEnvironmentRecovery,
} from "@automovie/interface";

import { perturb } from "../../reaction/internal/perturb";
import { planEnvironmentRecovery } from "../../reaction/internal/planEnvironmentRecovery";

/*
 * Resolving a walk's staged trip or slip: the walk is cut at the measured cue
 * and continues into a capture step, a fall or a braced rail catch
 * (`planEnvironmentRecovery`). Register
 * `HumanEnvironmentRecovery.environmentalRecovery` to use it.
 *
 * Timing: the walk keeps its own speed (`IAutoMovieMotionHumanWalkParams.pace`)
 * up to the cue; the lost foot is released over at most 0.14 s (provisional)
 * and the capture step, rail catch or fall take the perturbation law's own
 * times, on the same clock. A trip or a slip on an ordinary walk; a stumble
 * over a kerb, a slip on a wet floor.
 */
export namespace HumanEnvironmentRecovery {
  /*
   * Respond to a staged walking trip or slip. It accepts the perturbation's
   * entries, cancels nothing and leaves no channel to overlays.
   */
  export const environmentalRecovery: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanEnvironmentRecovery.IParams> =
    {
      name: "environmentalRecovery",
      accepts: perturb.accepts,
      interrupts: {},
      yields: [],
      plan: planEnvironmentRecovery,
    };
}
