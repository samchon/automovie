/**
 * What every `human-shot` step reads: the request, the viewer port and the
 * paths of this checkout's records and outputs.
 *
 * @evidence contracts/common.md#clear-and-simple-design One context carries the entry's resolved inputs to each step.
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanShotContext {
  /** The viewer script directory. */
  directory: string;

  /** Repository root. */
  root: string;

  /** `.shots/human-viewer`, where records, logs and captures live. */
  storage: string;

  /** `http://127.0.0.1:<port>` of the viewer. */
  origin: string;

  /** The viewer port. */
  port: number;

  /** This port's process record file. */
  record: string;

  /** This port's server output log, appended by a starting client. */
  logFile: string;

  /** How long one `/health` probe waits before it counts as unanswered, in milliseconds. */
  probeMs: number;

  /** The command (`ensure`, `status`, `stop`, `watch`, `render`, `sheet`, `compare`, `warm`). */
  command: string;

  /** The display query of a capture command. */
  query: string;

  /** The capture output file, or null for the default under `captures/`. */
  output: string | null;
}
