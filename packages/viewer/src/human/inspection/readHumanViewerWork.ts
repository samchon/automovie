import type { HumanViewerWork } from "./HumanViewerWork.js";

/**
 * Admit a browser progress record before the resident host publishes it. Unknown fields are discarded, and malformed console output cannot throw through the server's event listener.
 *
 * @evidence contracts/common.md#principled-implementation Admits only known string progress phases, required string identities and finite nonnegative counters, preserving optional completion strings/timings and discarding unknown fields.
 * @evidence contracts/common.md#clear-and-simple-design A nullable protocol decoder keeps malformed console traffic outside the server's progress event state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An array that stringifies to a known phase is refused rather than published as that phase, and decode failures never fabricate zero progress.
 * @evidence contracts/common.md#meaningful-documentation Documentation states the progress envelope, unknown-field projection and nonthrowing malformed-message result.
 * @evidence contracts/performance.md#efficient-algorithms JSON parsing scales with line bytes while phase/counter validation and constructing the fixed-field record use constant adapter work.
 * @evidence contracts/performance.md#reuse-equivalent-work Every console line is decoded independently; residency owns retaining the latest admitted progress record rather than this function caching one.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The decoder owns only temporary parsed data and the returned small record; it acquires no resident, event listener or transport handle.
 */
export function readHumanViewerWork(text: string): HumanViewerWork | null {
  try {
    const value: Partial<HumanViewerWork> | null = JSON.parse(
      text,
    ) as Partial<HumanViewerWork> | null;
    if (value === null || typeof value !== "object") return null;
    if (
      typeof value.revision !== "string" ||
      typeof value.frame !== "string" ||
      typeof value.doc !== "string"
    )
      return null;
    if (
      typeof value.phase !== "string" ||
      ![
        "loading",
        "cache-read",
        "build",
        "numeric-reply",
        "cache-write",
        "prepare",
        "draw",
        "idle",
        "failed",
      ].includes(value.phase)
    )
      return null;
    for (const field of [
      "at",
      "pending",
      "geometries",
      "textures",
      "residents",
      "residentBytes",
    ] as const)
      if (
        typeof value[field] !== "number" ||
        !Number.isFinite(value[field]) ||
        value[field] < 0
      )
        return null;
    if (value.completed !== undefined && typeof value.completed !== "string")
      return null;
    for (const field of ["completionElapsedMs", "completionStageMs"] as const)
      if (
        value[field] !== undefined &&
        (typeof value[field] !== "number" ||
          !Number.isFinite(value[field]) ||
          value[field] < 0)
      )
        return null;
    return {
      revision: value.revision,
      frame: value.frame,
      doc: value.doc,
      phase: value.phase!,
      at: value.at!,
      pending: value.pending!,
      geometries: value.geometries!,
      textures: value.textures!,
      residents: value.residents!,
      residentBytes: value.residentBytes!,
      completed: value.completed,
      completionElapsedMs: value.completionElapsedMs,
      completionStageMs: value.completionStageMs,
    };
  } catch {
    return null;
  }
}
