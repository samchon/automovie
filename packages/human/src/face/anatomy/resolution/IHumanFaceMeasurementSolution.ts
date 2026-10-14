/**
 * The channel weight a face measurement target solved to and the value it reads.
 *
 * @evidence contracts/common.md#principled-implementation One reached channel weight and actual measured value describe the numerical inverse's accepted result.
 * @evidence contracts/common.md#clear-and-simple-design The caller applies the selected existing channel while other channel weights remain unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readout tolerance is a numerical editor policy and does not establish clinical accuracy or global response monotonicity.
 * @evidence contracts/common.md#meaningful-documentation Weight stays within its authored envelope and measured uses the instrument's millimetre unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Channel search and bracket work execute in solveHumanFaceMeasurementTarget.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The inverse reuses its accepted actual readout rather than replacing it with target text.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only this small scalar/name result escapes; trial geometry remains owned by the read callback.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementSolution {
  /** The channel whose weight was solved. */
  channel: string;

  /** The solved weight, inside the channel's envelope. */
  weight: number;

  /** The reading at that weight, in the measurement's unit. */
  measured: number;
}
