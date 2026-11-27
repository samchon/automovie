import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import { physicalRecoverySwing } from "./physicalRecoverySwing";

/*
 * The step under way for a limb, if any.
 * Parameter state: The recovery's state, if any.
 * Parameter bone: The limb's endpoint bone.
 * Returns: Its step, or undefined.
 */
export function physicalRecoveryLimbSwing(
  state: IAutoMoviePhysicalRecoveryState | undefined,
  bone: string,
): IAutoMovieStepPlanner.IStep | undefined {
  return physicalRecoverySwing(state).find(
    (step: IAutoMovieStepPlanner.IStep): boolean => step.bone === bone,
  );
}
