import type { IHumanViewerHealthSources } from "./IHumanViewerHealthSources.js";
import type { IHumanViewerHealth } from "./IHumanViewerHealth.js";
import { humanViewerProtocol } from "./humanViewerProtocol.js";

/**
 * Assemble `/health` from owner reports. Ready means nonempty reported page authority and renderer text, not an independent draw or hardware observation. The retained authority can differ from a failed newest source, which serving and sourceError expose.
 *
 * @evidence contracts/common.md#principled-implementation Answer-time accessors preserve desired/serving authority and owner status; ready requires nonempty reported authority and renderer text rather than independently proven drawing, hardware or newest-source success.
 * @evidence contracts/common.md#clear-and-simple-design The assembler reads existing owners and adds only cross-owner health summaries, leaving queue, admission, capture and heap calculations with their producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale last-good display is explicitly labeled, original compile/latest error causes are preserved and retained array bytes do not become GPU-memory evidence.
 * @evidence contracts/common.md#meaningful-documentation The prose explains last-good readiness during source failure; the named answer type documents owner identity, units and nullable observation states.
 * @evidence contracts/performance.md#efficient-algorithms Assembly invokes each listed owner accessor once and does no document traversal; work and returned metadata size follow the status producers' current queue/error/admission populations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Health is a current request-time snapshot across mutable owners, so a prior answer under the same source revision is not equivalent current state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The answer borrows status data without acquiring runtime handles; HTTP serialization owns its transient result and each source owner keeps its own resource lifetime.
 */
export function assembleHumanViewerHealth(sources: IHumanViewerHealthSources): IHumanViewerHealth {
  const inventory: ReturnType<IHumanViewerHealthSources["inventory"]> = sources.inventory();
  const readyRevision: string = sources.readyRevision();
  const renderer: string = sources.renderer();
  const compilation: ReturnType<IHumanViewerHealthSources["sourceStatus"]> = sources.sourceStatus();
  const errors: string[] = sources.errors();
  return {
    service: "automovie-human-viewer",
    protocol: humanViewerProtocol,
    // Ownership is judged by the pid in the process record: the launcher's
    // when one started this server.
    pid: sources.owner ?? process.pid,
    serverPid: process.pid,
    port: sources.port,
    storage: sources.storage,
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
    queue: {
      limit: sources.queueLimit,
      ...sources.queue.status(),
      stage: sources.stage(),
    },
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
