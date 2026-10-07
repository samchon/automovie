/**
 * The process record a resident viewer writes as soon as it owns its port
 * (right after the public listener starts, before the page can draw),
 * under its selected mutable storage in the file its port names, so `status` and
 * `stop` can verify ownership of a server that is still starting. Only a record whose pid
 * equals the pid the answering server reports proves ownership.
 *
 * @evidence contracts/common.md#principled-implementation Ownership is the equality of this pid and the live health answer's public-port owner pid, never a process name.
 * @evidence contracts/common.md#meaningful-documentation States where the record lives and what it proves.
 * @author Samchon
 */
export interface IHumanViewerRecord {
  /** Public-port owner: the launcher PID, or server.mts when started directly. */
  pid: number;

  /** ISO time at which the public listener began owning its port. */
  startedAt: string;

  /** Public port owned by the recorded process. */
  port: number;
}
