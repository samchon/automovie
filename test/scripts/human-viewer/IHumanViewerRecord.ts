/**
 * The process record a resident viewer writes once it can draw, under
 * `.shots/human-viewer/` in the file its port names. Only a record whose pid
 * equals the pid the answering server reports proves ownership.
 *
 * @evidence contracts/common.md#principled-implementation Ownership is the equality of this pid and the live server's pid, never a process name.
 * @evidence contracts/common.md#meaningful-documentation States where the record lives and what it proves.
 * @author Samchon
 */
export interface IHumanViewerRecord {
  /** Process id of the `server.mts` process. */
  pid: number;

  /** ISO time at which the server became ready to draw. */
  startedAt: string;

  /** Port the server listens on. */
  port: number;
}
