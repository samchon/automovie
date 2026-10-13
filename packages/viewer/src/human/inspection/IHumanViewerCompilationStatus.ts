/**
 * What the last compile attempts left behind.
 *
 * A reported failure and last actual successful compile remain distinct facts. The error field contributes a cause to observation without supplying a complete diagnostic or retry policy.
 *
 * @evidence contracts/common.md#principled-implementation Latest compile error and last successful Human compile time preserve failure independently of the retained source generation.
 * @evidence contracts/common.md#clear-and-simple-design Two nullable facts report compile state without duplicating transformed modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A viewer-only edit may move serving identity without manufacturing a new successful Human compile time.
 * @evidence contracts/common.md#meaningful-documentation Null means no failure or no successful compile respectively; goodAt advances only for an actual Human compile.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Latest compile error and last successful Human compile time preserve failure independently of the retained source generation.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot A viewer-only edit may move serving identity without manufacturing a new successful Human compile time.
 *
 * @author Samchon
 */
export interface IHumanViewerCompilationStatus {
  /**
   * The failure of the newest attempt, or null when it succeeded.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Preserves the newest compile failure independently of any retained successful display.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Preserves the newest compile failure independently of any retained successful display.
   */
  error: string | null;

  /**
   * When the newest successful compile of the human package finished, or null
   * before the first. It moves only when `packages/human` changes. An edit to
   * the viewer page or the test layer changes `serving.revision` without moving
   * this time, because the human compile is not rerun for it.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Records only an actual successful Human-package compile, remaining null before the first and unchanged by display-only edits.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Records only an actual successful Human-package compile, remaining null before the first and unchanged by display-only edits.
   */
  goodAt: string | null;
}
