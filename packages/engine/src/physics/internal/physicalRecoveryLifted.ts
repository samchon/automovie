import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import { physicalRecoverySwing } from "./physicalRecoverySwing";

/*
 * The limbs a recovery swing has lifted: under way and no longer seated, which
 * the stance and support tracking no longer carry.
 * Parameter state: The recovery's state, if any.
 * Returns: Their endpoint bones, the swing's first.
 */
export function physicalRecoveryLifted(
  state: IAutoMoviePhysicalRecoveryState | undefined,
): string[] {
  return physicalRecoverySwing(state)
    .map((step: IAutoMovieStepPlanner.IStep): string => step.bone)
    .filter((bone: string): boolean => !state?.seating?.[bone]);
}
