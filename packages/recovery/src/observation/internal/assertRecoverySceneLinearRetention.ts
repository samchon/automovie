import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface";

/*
 * Check logical numerical retention before incremental designs are allocated.
 * The shared joint bound covers copied blocks, reduced factors and landmarks; a
 * caller adds transient point or resection factors retained during growth.
 * These scalar slots exclude JS overhead and the separately bounded seed fit.
 */
export function assertRecoverySceneLinearRetention(
  budget: IAutoMovieRecoveryCameraSceneBudget,
  cameras: number,
  observations: number,
  landmarks: number,
  transientEntries: number = 0,
): void {
  const width: number = 6 * cameras - 7;
  const slots: number =
    16 * observations * (width + 4) +
    16 * width * width +
    12 * landmarks * (width + 4) +
    transientEntries +
    64;
  if (
    cameras < 2 ||
    ![cameras, observations, landmarks, transientEntries, slots].every(
      (value: number): boolean => value >= 0,
    ) ||
    slots > budget.maxResidentLinearEntries
  ) {
    const error: Error = new Error(
      "camera-scene-budget: retained linear scalar slots exhausted",
    );
    error.name = "RecoverySceneBudget";
    throw error;
  }
}
