import type { IAutoMovieRecoveryMeshSections } from "../structures/mesh/IAutoMovieRecoveryMeshSections";
import { readRecoveryMetadata as read } from "./readRecoveryMetadata";

/**
 * Gather saved open-run metadata without preempting its local numerical refusal.
 * Known names and confirmed fit misses remain literal observations. Missing fit
 * fields are counted separately; an incomplete estimate inventory has no maximum.
 *
 * @evidence contracts/common.md#principled-implementation Exact graph addresses read their own saved fields; unknown names, fit flags, bounds and span inventories remain explicit diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design Both grid and streamed hosts reuse one metadata scan before their existing local generation boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No name, fit success, zero error or curve is fabricated when a saved field is malformed; original coefficients remain untouched.
 * @evidence contracts/common.md#meaningful-documentation Documents confirmed misses, unknown metadata counts and nullable incomplete maxima and span counts.
 * @evidence contracts/performance.md#efficient-algorithms N run nodes require O(N) time and retained names and diagnostics; each metadata field uses a fixed-length path.
 * @evidence contracts/performance.md#reuse-equivalent-work One pass serves run reports and work telemetry without another curve evaluation or mesh traversal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned scalar metadata belongs to the run caller; no curve buffers, cache or external resources are retained.
 */
export function describeRecoveryOpenRun(
  bundle: IAutoMovieRecoveryMeshSections,
  nodes: readonly { section: number; arc: number }[],
): {
  curves: string[];
  diagnostics: string[];
  fitTargetMisses: number;
  unqualifiedFitMetadata: number;
  fitPolylineUpperEstimateMaximumMm: number | null;
  sourceSpans: number | null;
} {
  const curves: string[] = [];
  const diagnostics: string[] = [];
  let fitTargetMisses: number = 0;
  let unqualifiedFitMetadata: number = 0;
  let fitPolylineUpperEstimateMaximumMm: number | null = 0;
  let sourceSpans: number | null = 0;
  for (const node of nodes) {
    const observed: unknown = read(bundle, [
      "reports",
      String(node.section),
      "open",
      String(node.arc),
    ]);
    const name: unknown = read(observed, ["curve", "name"]);
    if (typeof name === "string" && name.length > 0) curves.push(name);
    else
      diagnostics.push(
        `Open course ${node.section}:${node.arc} has no saved coefficient identity`,
      );
    const spans: unknown = read(observed, ["curve", "spans"]);
    sourceSpans =
      sourceSpans !== null && Array.isArray(spans)
        ? sourceSpans + spans.length
        : null;
    const met: unknown = read(observed, ["toleranceMet"]);
    const estimate: unknown = read(observed, ["polylineUpperEstimateMm"]);
    if (met === false) fitTargetMisses++;
    if (
      typeof met !== "boolean" ||
      typeof estimate !== "number" ||
      !Number.isFinite(estimate) ||
      estimate < 0
    ) {
      unqualifiedFitMetadata++;
      diagnostics.push(
        `Open course ${node.section}:${node.arc} fit qualification metadata is unavailable`,
      );
    }
    fitPolylineUpperEstimateMaximumMm =
      fitPolylineUpperEstimateMaximumMm !== null &&
      typeof estimate === "number" &&
      Number.isFinite(estimate) &&
      estimate >= 0
        ? Math.max(fitPolylineUpperEstimateMaximumMm, estimate)
        : null;
  }
  if (sourceSpans === null)
    diagnostics.push("Open run source-span count is unknown");
  return {
    curves,
    diagnostics,
    fitTargetMisses,
    unqualifiedFitMetadata,
    fitPolylineUpperEstimateMaximumMm,
    sourceSpans,
  };
}
