/**
 * Consumed scene work, including failed and rolled-back transactions.
 *
 * @evidence contracts/common.md#principled-implementation Counters increase before their owning action and never roll back with geometry; zero means not attempted rather than a successful numerical stage.
 * @evidence contracts/common.md#clear-and-simple-design One bounded ledger keeps repeated-work accounting separate from retained scene coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dimension-sweep units are not measured FLOPs, elapsed time, host RSS or a probability of accuracy.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish proposed, refused and completed work populations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no numerical work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only owned scalar data is retained.
 */
export interface IAutoMovieRecoverySceneWork {
  /** Camera transactions begun, including failures. */
  cameraAttempts: number;

  /** Six-point proposals actually started. */
  resectionTrials: number;

  /** Original point designs actually attempted, including refused/retried tracks. */
  triangulations: number;

  /** Attempted point designs that returned no qualified point. */
  triangulationRefusals: number;

  /** Joint fits actually begun, including rolled-back fits. */
  jointFits: number;

  /** Joint iteration attempts, including gradient-stop checks. */
  jointIterationAttempts: number;

  /** Charged dimension-sweep units before point/joint work, not actual scalar-operation counts. */
  linearWork: number;
}
