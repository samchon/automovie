import { RecoveryChartBoundaryNetwork as N } from "./RecoveryChartBoundaryNetwork";
import { RecoveryChartSurface as F } from "./RecoveryChartSurface";
import { refineRecoveryChartBoundaryChords as R } from "./refineRecoveryChartBoundaryChords";

/**
 * Fit a selected private chart batch after one common boundary-network pass.
 * All chart families enter the same network before any coefficient solve, so
 * observed quarter cuts and maximal physical arcs can be reconciled across
 * selected slabs. Chart names retain the caller's private ownership metadata.
 * A failed global network falls back to explicitly unqualified independent
 * networks, preserving finite siblings without claiming shared-bank continuity.
 * Failed maps and fits remain local results and never supply a source mesh.
 *
 * @evidence contracts/common.md#principled-implementation One physical-key and base-edge insertion network registers all selected chart boundaries before harmonic mapping and constrained physical-area fitting.
 * @evidence contracts/common.md#clear-and-simple-design This operation owns the two-pass boundary-to-fit sequence; topology preparation and source-face accounting remain with the caller, and generation consumes only the resulting coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate welding, missing-bank invention, source normal publication or source mesh fallback repairs a failed shared network. Independent retained charts remain explicitly unqualified.
 * @evidence contracts/common.md#meaningful-documentation States batch scope, private name-based ownership, shared authority, local failures and independent finite retention.
 * @evidence contracts/performance.md#efficient-algorithms One network pass processes the bounded selected chart population before sequential fits. A failed network performs at most one independent pass per chart; the network and fit owners state their geometry-dependent costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Common arc coefficients and accepted registrations are reused by every incident chart; each chart's private points serve one map and its residual-driven fits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the prepared batch. The generator retains its network clone and at most one active fit until completion or cancellation; no public source topology or process handle escapes.
 */
export function* RecoveryChartBatch(input: {
  charts: Parameters<typeof N>[0]["charts"];
  owner: Parameters<typeof N>[0]["owner"];
  fit: {
    toleranceMm: number;
    maxSpans: number;
    cornerDegrees: number;
    maxPatches: number;
    maxIterations: number;
    maxObservationRows?: number;
    maxRefinements?: number;
    physicalGradientLengthMm?: number;
  };
}): Generator<
  {
    name: string;
    chart: ReturnType<typeof N>["charts"][number] | null;
    fit: ReturnType<typeof F.fit> | null;
    reason: string | null;
    sharedBoundaryQualified: boolean;
    networkMaximumPointChangeMm: number;
    diagnostics: string[];
  },
  void,
  void
> {
  let network: ReturnType<typeof N>,
    sharedBoundaryQualified: boolean = true;
  try {
    network = N({ charts: input.charts, owner: input.owner });
  } catch (failure: unknown) {
    sharedBoundaryQualified = false;
    network = {
      charts: [],
      maximumPointChangeMm: 0,
      diagnostics: [
        `Selected-domain common network failed; independent finite siblings remain without shared-bank qualification: ${failure instanceof Error ? failure.message : String(failure)}`,
      ],
    };
    for (const prepared of input.charts)
      try {
        const independent: ReturnType<typeof N> = N({
          charts: [prepared],
          owner: input.owner,
        });
        network.charts.push(...independent.charts);
        network.maximumPointChangeMm = Math.max(
          network.maximumPointChangeMm,
          independent.maximumPointChangeMm,
        );
        network.diagnostics.push(...independent.diagnostics);
      } catch (error: unknown) {
        yield {
          name: prepared.name,
          chart: null,
          fit: null,
          reason: `boundary-network: ${error instanceof Error ? error.message : String(error)}`,
          sharedBoundaryQualified: false,
          networkMaximumPointChangeMm: 0,
          diagnostics: network.diagnostics,
        };
      }
  }
  for (const chart of network.charts)
    try {
      const refined: ReturnType<typeof R> = R({
        verticesMm: chart.verticesMm,
        triangles: chart.triangles,
        vertexKeys: chart.physicalKeys,
        sides: chart.sides,
      });
      const fit: ReturnType<typeof F.fit> = F.fit({
        ...input.fit,
        name: chart.name,
        verticesMm: refined.verticesMm,
        triangles: refined.triangles,
        sides: chart.sides,
        boundaries: chart.boundaries,
      });
      yield {
        name: chart.name,
        chart: {
          ...chart,
          verticesMm: refined.verticesMm,
          triangles: refined.triangles,
          physicalKeys: refined.vertexKeys,
        },
        fit,
        reason: null,
        sharedBoundaryQualified,
        networkMaximumPointChangeMm: network.maximumPointChangeMm,
        diagnostics: network.diagnostics,
      };
    } catch (failure: unknown) {
      yield {
        name: chart.name,
        chart,
        fit: null,
        reason: `chart-map-or-fit: ${failure instanceof Error ? failure.message : String(failure)}`,
        sharedBoundaryQualified,
        networkMaximumPointChangeMm: network.maximumPointChangeMm,
        diagnostics: network.diagnostics,
      };
    }
}
