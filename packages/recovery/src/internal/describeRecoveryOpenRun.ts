import type {
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryOpenRunDescriptionOperation,
} from "@automovie/interface";

/**
 * Gather saved open-run metadata without preempting its local numerical
 * refusal. Known names and confirmed fit misses remain literal observations; a
 * negative estimate counts as unqualified and leaves no maximum.
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
  let sourceSpans: number = 0;
  for (const node of nodes) {
    const observed: IAutoMoviePolylineFit =
      bundle.reports[node.section]!.open[node.arc]!;
    curves.push(observed.curve.name);
    sourceSpans += observed.curve.spans.length;
    if (observed.toleranceMet === false) fitTargetMisses++;
    const estimate: number = observed.polylineUpperEstimateMm;
    if (estimate < 0) {
      unqualifiedFitMetadata++;
      diagnostics.push(
        `Open course ${node.section}:${node.arc} fit qualification metadata is unavailable`,
      );
    }
    fitPolylineUpperEstimateMaximumMm =
      fitPolylineUpperEstimateMaximumMm !== null && estimate >= 0
        ? Math.max(fitPolylineUpperEstimateMaximumMm, estimate)
        : null;
  }
  return {
    curves,
    diagnostics,
    fitTargetMisses,
    unqualifiedFitMetadata,
    fitPolylineUpperEstimateMaximumMm,
    sourceSpans,
  };
}
