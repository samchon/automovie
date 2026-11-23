import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanEnvironmentRecovery,
} from "@automovie/interface";

import { perturb } from "../reaction/perturb";
import { planEnvironmentRecovery } from "../reaction/planEnvironmentRecovery";

/**
 * Resolving a walk's staged trip or slip: the walk is cut at the measured
 * cue and continues into a capture step, a fall or a braced rail catch
 * (`planEnvironmentRecovery`). Register
 * `HumanEnvironmentRecovery.environmentalRecovery` to use it.
 *
 * Timing: the walk keeps its own speed (`IAutoMovieMotionHumanWalkParams.pace`) up to the cue; the lost foot is released over at most 0.14 s (provisional) and the capture step, rail catch or fall take the perturbation law's own times, on the same clock. A trip or a slip on an ordinary walk; a stumble over a kerb, a slip on a wet floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cut, the outcomes and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record that accepts the same entries as the perturbation it delegates to.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The cue is measured on the displayed entry, never assumed from the parameters.
 */
export namespace HumanEnvironmentRecovery {
  /** Respond to a staged walking trip or slip. It accepts the perturbation's entries, cancels nothing and leaves no channel to overlays. */
  export const environmentalRecovery: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanEnvironmentRecovery.IParams> =
    {
      name: "environmentalRecovery",
      accepts: perturb.accepts,
      interrupts: {},
      yields: [],
      plan: planEnvironmentRecovery,
    };
}
