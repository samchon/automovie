/**
 * The process record a resident viewer writes as soon as it owns its port (right after the public listener starts, before the page can draw), under its selected mutable storage in the file its port names, so `status` and `stop` can verify ownership of a server that is still starting. Only a record whose pid equals the pid the answering server reports and whose OS creation stamp still identifies that process can authorize termination.
 *
 * @evidence contracts/common.md#principled-implementation Records the public listener's owner PID, OS creation identity, listener-start time and selected port for existing control ownership checks.
 * @evidence contracts/common.md#clear-and-simple-design Separates public launcher ownership from server child PID and current display readiness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts PID equality alone cannot authorize termination; absent legacy creation identity refuses stop and the executor rechecks actual creation provenance.
 * @evidence contracts/common.md#meaningful-documentation Documents mutable per-port record, launcher/direct-server meaning and early listener ownership before GPU readiness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no process query; control readers parse it and native ownership steps inspect the actual process tree/stamps.
 * @evidence contracts/performance.md#reuse-equivalent-work The same captured creation identity accompanies a stop plan and executor check; another recycled PID is not equivalent owned process.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The launcher/server owns record publication and lifetime, while native handle acquisition/termination remain with their executor.
 *
 * @author Samchon
 */
export interface IHumanViewerRecord {
  /**
   * Public-port owner: the launcher PID, or server.ts when started directly.
   */
  pid: number;

  /**
   * OS creation identity; absent in old records, which cannot authorize stop.
   */
  processStartedAt?: string;

  /** ISO time at which the public listener began owning its port. */
  startedAt: string;

  /** Public port owned by the recorded process. */
  port: number;
}
