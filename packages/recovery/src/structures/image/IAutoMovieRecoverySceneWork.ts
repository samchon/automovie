/**
 * Consumed scene work, including failed and rolled-back transactions.
 *
 * @evidence contracts/development/design.md#principled-representation Counters increase before their owning action and never roll back with geometry; zero means not attempted rather than a successful numerical stage.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One bounded ledger keeps repeated-work accounting separate from retained scene coverage.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Dimension-sweep units are not measured FLOPs, elapsed time, host RSS or a probability of accuracy.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish proposed, refused and completed work populations.
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
