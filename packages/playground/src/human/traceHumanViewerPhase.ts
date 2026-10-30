/** Report one bounded actual browser phase through the worker's existing console observation.
 *
 * @param phase Actual caller-owned boundary, not an inferred success state.
 * @param module Native module id when known, otherwise null.
 * @evidence contracts/common.md#principled-implementation Records UTC and the browser's actual optional performance.memory.usedJSHeapSize; unsupported metrics remain null and never stand for OS process RSS.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the existing fixed-prefix console and memory IPC path for viewer build and commitment stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostic errors are dropped without changing geometry, serialization, hashing or cleanup.
 * @evidence contracts/common.md#meaningful-documentation States actual phase and memory realm, including missing-metric semantics.
 * @evidence contracts/performance.md#efficient-algorithms Reads one optional counter and serializes a fixed small record without model traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Every boundary is an observation; no separate renderer or observer process is acquired.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no state or handles; the existing worker trace bounds escaped packets.
 */
export function traceHumanViewerPhase(
  phase: string,
  module: string | null,
): void {
  try {
    const memory: { usedJSHeapSize?: number } | undefined = (
      performance as Performance & { memory?: { usedJSHeapSize?: number } }
    ).memory;
    const value: number | undefined = memory?.usedJSHeapSize;
    console.info(
      "human-native-phase " +
        JSON.stringify({
          phase,
          module,
          utc: new Date().toISOString(),
          browserJsHeapUsedBytes:
            typeof value === "number" && Number.isFinite(value) ? value : null,
        }),
    );
  } catch {
    /* Observation failure cannot replace the owning operation's result. */
  }
}
