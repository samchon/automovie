import type {
  IAutoMovieRecoveryChartBatch,
  IAutoMovieRecoveryChartBoundaryChordsRefinementOperation,
  IAutoMovieRecoveryChartBoundaryNetwork,
  IAutoMovieRecoveryChartSurface,
} from "@automovie/interface";

import { RecoveryChartBoundaryNetwork as N } from "./RecoveryChartBoundaryNetwork";
import { RecoveryChartSurface as F } from "./RecoveryChartSurface";
import { refineRecoveryChartBoundaryChords as R } from "../geometry/internal/refineRecoveryChartBoundaryChords";

/**
 * Fit a selected private chart batch after one common boundary-network pass.
 * All chart families enter the same network before any coefficient solve, so
 * observed quarter cuts and maximal physical arcs can be reconciled across
 * selected slabs. Chart names retain the caller's private ownership metadata. A
 * failed global network falls back to explicitly unqualified independent
 * networks, preserving finite siblings without claiming shared-bank continuity.
 * Failed maps and fits remain local results and never supply a source mesh.
 */
export function* RecoveryChartBatch(
  input: Parameters<IAutoMovieRecoveryChartBatch.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartBatch.Operation> {
  let network: ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation>,
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
        const independent: ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation> =
          N({
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
      const refined: ReturnType<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation> =
        R({
          verticesMm: chart.verticesMm,
          triangles: chart.triangles,
          vertexKeys: chart.physicalKeys,
          sides: chart.sides,
        });
      const fit: ReturnType<IAutoMovieRecoveryChartSurface.Fit> = F.fit({
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
