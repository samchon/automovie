import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import { physicalRecoverySwing } from "./physicalRecoverySwing";

/*
 * The limbs asked to step that have not lifted: still support, each giving up
 * its share over its unloading ramp.
 * Parameter state: The recovery's state, if any.
 * Returns: Their endpoint bones, the swing's first.
 */
export function physicalRecoveryRequested(
  state: IAutoMoviePhysicalRecoveryState | undefined,
): string[] {
  return physicalRecoverySwing(state)
    .map((step: IAutoMovieStepPlanner.IStep): string => step.bone)
    .filter((bone: string): boolean => !!state?.seating?.[bone]);
}
