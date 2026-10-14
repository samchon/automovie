/**
 * What every `human-shot` step reads: the request, the viewer port and the paths of this checkout's records and outputs.
 *
 * @evidence contracts/common.md#principled-implementation The human-shot client carries parsed request fields and resolved checkout/storage/loopback paths to its existing control and capture steps.
 * @evidence contracts/common.md#clear-and-simple-design One context keeps port, ownership record and append-only launch log coherent across probe, start, stop and capture operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unanswered port does not authorize killing or launching over it; probeMs only bounds one health request, not numerical or GPU work.
 * @evidence contracts/common.md#meaningful-documentation Names mutable storage, record/log paths, output default and health timeout milliseconds; process ownership still requires creation-stamp checks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no IO; individual client steps own network probes, process queries and capture byte writes.
 * @evidence contracts/performance.md#reuse-equivalent-work The command shares resolved path/port configuration across its steps while each health probe reads current listener authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The client owns this request context; strings retain no native process/browser handles, and capture output bytes belong to the write operation.
 *
 * @author Samchon
 */
export interface IHumanShotContext {
  /** The viewer script directory. */
  directory: string;

  /** Repository root. */
  root: string;

  /**
   * Resolved mutable directory where records, logs, inputs and captures live.
   */
  storage: string;

  /** `http://127.0.0.1:<port>` of the viewer. */
  origin: string;

  /** The viewer port. */
  port: number;

  /** This port's process record file. */
  record: string;

  /** This port's server output log, appended by a starting client. */
  logFile: string;

  /**
   * How long one `/health` probe waits before it counts as unanswered, in milliseconds.
   */
  probeMs: number;

  /**
   * The command (`ensure`, `status`, `stop`, `watch`, `render`, `sheet`, `compare`, `warm`).
   */
  command: string;

  /** The display query of a capture command. */
  query: string;

  /** The capture output file, or null for the default under `captures/`. */
  output: string | null;
}
