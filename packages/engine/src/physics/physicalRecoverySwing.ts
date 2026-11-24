import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

/**
 * The steps a recovery has under way (`advancePhysicalBalance`), any limbs at
 * once. Each lifts as its step begins.
 *
 * @param state The recovery's state, if any.
 * @returns The swing, then the swings in the order they lifted; empty with
 *   none.
 */
export function physicalRecoverySwing(
  state: IAutoMoviePhysicalRecoveryState | undefined,
): IAutoMovieStepPlanner.IStep[] {
  return [
    ...(state?.swing ? [state.swing] : []),
    ...Object.values(state?.swings ?? {}),
  ];
}
