import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import { physicalRecoverySwing } from "./physicalRecoverySwing";

/**
 * The limbs asked to step that have not lifted: still support, each giving up
 * its share over its unloading ramp.
 *
 * @param state The recovery's state, if any.
 * @returns Their endpoint bones, the swing's first.
 */
export function physicalRecoveryRequested(
  state: IAutoMoviePhysicalRecoveryState | undefined,
): string[] {
  return physicalRecoverySwing(state)
    .map((step: IAutoMovieStepPlanner.IStep): string => step.bone)
    .filter((bone: string): boolean => !!state?.seating?.[bone]);
}
