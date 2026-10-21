import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface/recovery";

/**
 * Check logical numerical retention before incremental designs are allocated.
 * The shared joint bound covers copied blocks, reduced factors and landmarks;
 * a caller adds transient point or resection factors retained during growth.
 * These scalar slots exclude JS overhead and the separately bounded seed fit.
 *
 * @evidence contracts/common.md#principled-implementation For C=6N-7 active coordinates, 16E(C+4)+16C^2+12L(C+4)+64 bounds joint arrays, retained point copies and fixed current-radius chart scratch. Additional transient slots cover growth/resection factors; safe integer checks precede allocation under the unchanged ceiling.
 * @evidence contracts/common.md#clear-and-simple-design One preallocation check serves growth, resection and joint owners without changing geometric gates or charging computational work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No postallocation check, raised ceiling or byte/RSS interpretation supplies capacity. Failure uses the scene budget error so the accepted geometry remains unchanged.
 * @evidence contracts/common.md#meaningful-documentation Defines active width, retained versus transient slots, seed exclusion and logical-memory qualification.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar arithmetic costs constant time and space, avoiding an allocation solely to measure its size.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers maintain population counts while growing points; the same bound checks the eventual joint fit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This check acquires no arrays or external resources and returns no state; its distinguished error preserves the caller-owned checkpoint.
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
      (value: number): boolean => Number.isSafeInteger(value) && value >= 0,
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
