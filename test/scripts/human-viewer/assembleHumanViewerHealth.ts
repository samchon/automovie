import type { IHumanViewerHealthSources } from "./IHumanViewerHealthSources";

/**
 * The `/health` answer. A ready server can draw; it may be drawing the last
 * good build while the newest source fails, which `serving` and
 * `sourceError` say.
 *
 * @evidence contracts/common.md#principled-implementation Readiness, staleness and the source error are reported apart, so a stale but drawing server is not read as current.
 * @evidence contracts/common.md#clear-and-simple-design One function assembles the answer from the server's accessors.
 * @evidence contracts/common.md#meaningful-documentation States what ready and stale mean.
 */
export function assembleHumanViewerHealth(sources: IHumanViewerHealthSources) {
  const inventory = sources.inventory();
  const readyRevision = sources.readyRevision();
  const renderer = sources.renderer();
  const compilation = sources.sourceStatus();
  const errors = sources.errors();
  return {
    service: "automovie-human-viewer",
    // Ownership is judged by the pid in the process record: the launcher's
    // when one started this server.
    pid: sources.owner ?? process.pid,
    serverPid: process.pid,
    port: sources.port,
    revision: inventory.revision,
    renderer,
    ready: readyRevision !== "" && renderer !== "",
    serving: {
      revision: readyRevision,
      current: inventory.revision,
      stale: readyRevision !== inventory.revision,
      goodAt: compilation.goodAt,
    },
    sourceError: compilation.error ?? errors[errors.length - 1] ?? null,
    compilation,
    errors,
    sourceUpdating: sources.sourceUpdating(),
    work: sources.work(),
    heap: sources.heap.status(),
    revisions: sources.revisions.current(),
    queue: { limit: sources.queueLimit, ...sources.queue.status() },
    lastEdit: sources.lastEdit(),
    ...sources.capture.status(),
    warm: sources.warming,
    startup: sources.startup,
    admission: sources.admission(),
    relaunches: sources.relaunches(),
    trim: sources.trim(),
    holding: sources.holding(),
    uptimeMs: Math.round(process.uptime() * 1000),
  };
}
