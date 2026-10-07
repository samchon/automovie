import type { HumanViewerWork } from "./HumanViewerWork";

/**
 * Admit a browser progress record before the resident host publishes it.
 * Unknown fields are discarded, and malformed console output cannot throw
 * through the server's event listener.
 *
 * @evidence contracts/common.md#principled-implementation Closed stages and finite nonnegative counters admit only the progress protocol's actual distinctions.
 * @evidence contracts/common.md#clear-and-simple-design One parser owns console-message admission and projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never recognizes document names or invents a missing stage.
 * @evidence contracts/common.md#meaningful-documentation Defines refusal and metadata-only projection at the browser boundary.
 */
export function readHumanViewerWork(text: string): HumanViewerWork | null {
  try {
    const value = JSON.parse(text) as Partial<HumanViewerWork> | null;
    if (value === null || typeof value !== "object") return null;
    if (typeof value.revision !== "string" || typeof value.frame !== "string" || typeof value.doc !== "string") return null;
    if (!["loading", "cache-read", "build", "numeric-reply", "cache-write", "prepare", "draw", "idle", "failed"].includes(String(value.phase))) return null;
    for (const field of ["at", "pending", "geometries", "textures", "residents", "residentBytes"] as const)
      if (typeof value[field] !== "number" || !Number.isFinite(value[field]) || value[field] < 0) return null;
    if (value.completed !== undefined && typeof value.completed !== "string") return null;
    for (const field of ["completionElapsedMs", "completionStageMs"] as const)
      if (value[field] !== undefined && (typeof value[field] !== "number" || !Number.isFinite(value[field]) || value[field] < 0)) return null;
    return { revision: value.revision, frame: value.frame, doc: value.doc,
      phase: value.phase!, at: value.at!, pending: value.pending!,
      geometries: value.geometries!, textures: value.textures!,
      residents: value.residents!, residentBytes: value.residentBytes!,
      completed: value.completed, completionElapsedMs: value.completionElapsedMs,
      completionStageMs: value.completionStageMs };
  } catch {
    return null;
  }
}
