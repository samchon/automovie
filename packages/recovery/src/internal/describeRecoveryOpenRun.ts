import type { IAutoMovieRecoveryOpenRunDescriptionOperation } from "@automovie/interface";

import { readRecoveryMetadata as read } from "./readRecoveryMetadata";

/**
 * Gather saved open-run metadata without preempting its local numerical refusal.
 * Known names and confirmed fit misses remain literal observations. Missing fit
 * fields are counted separately; an incomplete estimate inventory has no maximum.
 */
export function describeRecoveryOpenRun(
  bundle: Parameters<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation>[0],
  nodes: Parameters<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryOpenRunDescriptionOperation.Operation> {
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
