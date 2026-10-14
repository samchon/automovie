/**
 * Solve one measured detailed channel for a target length in metres. The worker supplies the loaded body's declared reach to the numerical inverse. An unreachable target is reported by that inverse rather than clamped or rewritten in the message.
 *
 * @evidence contracts/common.md#principled-implementation The solveMeasurement discriminant binds one channel, starting shape and target length to the body's measured-channel inverse; target units remain metres across the worker boundary.
 * @evidence contracts/common.md#clear-and-simple-design A single-channel request does not duplicate basis or reach data already loaded by the resident worker; correlation stays with the page transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Target lengths remain caller inputs, including unreachable values that the inverse refuses, without clamping them to an example's expected measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the loaded reach and unreachable-target refusal; the fields distinguish the starting shape, measured channel and metre-valued target.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No bracketing or shape evaluation occurs in this inverse-request schema; the numerical measurement solver owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A solve request describes one operation and does not merge intents or memoize solved shapes across user edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This inverse payload acquires no source or worker; transport request retirement bounds how long its cloned shape remains queued.
 *
 * @author Samchon
 */
export interface IBodySimpleSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "solveMeasurement";

  /** The detailed shape the solve starts from. */
  shape: Record<string, number>;

  /** The measured channel to solve. */
  channel: string;

  /** The requested measurement, in metres. */
  targetMetres: number;
}
