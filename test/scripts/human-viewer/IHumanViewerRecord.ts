/**
 * The process record a resident viewer writes as soon as it owns its port
 * (right after the development server listens, before the page can draw),
 * under `.shots/human-viewer/` in the file its port names, so `status` and
 * `stop` can verify ownership of a server that is still starting. Only a record whose pid
 * equals the pid the answering server reports proves ownership.
 *
 * @evidence contracts/common.md#principled-implementation Ownership is the equality of this pid and the live server's pid, never a process name.
 * @evidence contracts/common.md#meaningful-documentation States where the record lives and what it proves.
 * @author Samchon
 */
export interface IHumanViewerRecord {
  /** Process id of the `server.mts` process. */
  pid: number;

  /** ISO time at which the server began listening on its port. */
  startedAt: string;

  /** Port the server listens on. */
  port: number;
}
