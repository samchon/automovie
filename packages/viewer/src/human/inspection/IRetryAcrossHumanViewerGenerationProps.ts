/**
 * How a generation-change retry waits and how often it tries.
 *
 * @evidence contracts/common.md#principled-implementation Retry configuration pairs physical source settlement with a total-attempt bound for generation-change refusals.
 * @evidence contracts/common.md#clear-and-simple-design The retry owner decides eligibility; the host supplies only settlement and the requested attempt bound.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface adds no timer, failed-build suppression or independent permission to restart a viewer.
 * @evidence contracts/common.md#meaningful-documentation Explains the first-attempt-inclusive bound and settlement on a drawable generation.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Retry configuration pairs physical source settlement with a total-attempt bound for generation-change refusals.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The retry owner decides eligibility; the host supplies only settlement and the requested attempt bound.
 * @author Samchon
 */
export interface IRetryAcrossHumanViewerGenerationProps {
  /**
   * Waits until a source generation can draw again.
   *
   * @evidence contracts/common.md#principled-implementation Settlement waits for the drawable generation used by an eligible generation-change retry.
   * @evidence contracts/common.md#clear-and-simple-design The retry loop owns attempts and refusal classification; the host supplies readiness waiting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This wait does not suppress a non-generation failure or restart a slow viewer.
   * @evidence contracts/common.md#meaningful-documentation States that source readiness is awaited before the next eligible attempt.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Settlement waits for the drawable generation used by an eligible generation-change retry.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The retry loop owns attempts and refusal classification; the host supplies readiness waiting.
   */
  settle: () => Promise<void>;

  /**
   * Total attempts, the first included; the last refusal is returned after them.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Total attempts, the first included; the last refusal is returned after them. Retry configuration pairs physical source settlement with a total-attempt bound for generation-change refusals.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Total attempts, the first included; the last refusal is returned after them. The retry owner decides eligibility; the host supplies only settlement and the requested attempt bound.
   */
  attempts: number;
}
