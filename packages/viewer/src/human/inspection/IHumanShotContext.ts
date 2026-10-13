/**
 * What every `human-shot` step reads: the request, the viewer port and the
 * paths of this checkout's records and outputs.
 *
 * @evidence contracts/common.md#clear-and-simple-design One context carries the entry's resolved inputs to each step.
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation Resolved origin, port and per-process record paths identify the viewer each CLI step reads or controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Storage and process-record locations come from the selected checkout and instance, not a hardcoded viewer PID.
 *
 * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Resolved origin, port and per-process record paths identify the viewer each CLI step reads or controls.
 * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Storage and process-record locations come from the selected checkout and instance, not a hardcoded viewer PID.
 *
 * @author Samchon
 */
export interface IHumanShotContext {
  /**
   * The viewer script directory.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Locates the maintained viewer command and server entry rather than relying on a session-specific working directory.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Locates the maintained viewer command and server entry rather than relying on a session-specific working directory.
   */
  directory: string;

  /**
   * Repository root.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Keeps resolved checkout ownership with the command's instance and source paths.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Keeps resolved checkout ownership with the command's instance and source paths.
   */
  root: string;

  /**
   * Resolved mutable directory where records, logs, inputs and captures live.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Identifies mutable runtime records and captures separately from immutable Human numerical assets.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Identifies mutable runtime records and captures separately from immutable Human numerical assets.
   */
  storage: string;

  /**
   * `http://127.0.0.1:<port>` of the viewer.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Connects command observations to the selected local viewer instead of another listener's service.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Connects command observations to the selected local viewer instead of another listener's service.
   */
  origin: string;

  /**
   * The viewer port.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Binds control and status requests to the instance-specific public port.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Binds control and status requests to the instance-specific public port.
   */
  port: number;

  /**
   * This port's process record file.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Selects this port's process-ownership record for checked status and explicit stop.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Selects this port's process-ownership record for checked status and explicit stop.
   */
  record: string;

  /**
   * This port's server output log, appended by a starting client.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Keeps startup diagnostics in the selected instance's output log rather than another viewer's files.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Keeps startup diagnostics in the selected instance's output log rather than another viewer's files.
   */
  logFile: string;

  /**
   * How long one `/health` probe waits before it counts as unanswered, in milliseconds.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Bounds one health observation in milliseconds without treating an unanswered connection as an absent owner.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Bounds one health observation in milliseconds without treating an unanswered connection as an absent owner.
   */
  probeMs: number;

  /**
   * The command (`ensure`, `status`, `stop`, `watch`, `render`, `sheet`, `compare`, `warm`).
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Carries the elected command so later steps perform only the requested viewer operation.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Carries the elected command so later steps perform only the requested viewer operation.
   */
  command: string;

  /**
   * The display query of a capture command.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Carries the actual capture display selection instead of substituting a default document silently.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Carries the actual capture display selection instead of substituting a default document silently.
   */
  query: string;

  /**
   * The capture output file, or null for the default under `captures/`.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Distinguishes an explicit capture output from the nullable default under the selected storage.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Distinguishes an explicit capture output from the nullable default under the selected storage.
   */
  output: string | null;
}
