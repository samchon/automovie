import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDiskChart,
  IAutoMovieRecoveryFeatureChartCuts,
  IAutoMovieRecoveryFeatureChartPreparation,
  IAutoMovieRecoveryMultiBoundaryChart,
} from "@automovie/interface";

import { RecoveryDiskChart as D } from "./RecoveryDiskChart";
import { RecoveryFeatureChartCuts as F } from "./RecoveryFeatureChartCuts";
import { RecoveryMultiBoundaryChart as M } from "./RecoveryMultiBoundaryChart";

/*
 * Prepare privately cut feature banks for a common four-arc boundary network.
 * Unique occurrence keys guide auxiliary cuts; repeated physical keys retain
 * source identity without welding private fans. Every output remains an
 * observation chart. Closed components and failed topology or disk admissions
 * stay unsupported.
 */
export function RecoveryFeatureChartPreparation(
  input: Parameters<IAutoMovieRecoveryFeatureChartPreparation.Operation>[0],
): ReturnType<IAutoMovieRecoveryFeatureChartPreparation.Operation> {
  if (input.maxCharts < 0)
    throw new Error(
      "Feature preparation needs an explicit remaining chart budget",
    );
  const cut: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation> =
      F(input),
    charts: ReturnType<IAutoMovieRecoveryFeatureChartPreparation.Operation>["charts"] =
      [],
    unsupported: ReturnType<IAutoMovieRecoveryFeatureChartPreparation.Operation>["unsupported"] =
      [];
  for (let i: number = 0; i < cut.charts.length; i++) {
    const chart: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>["charts"][number] =
        cut.charts[i]!,
      name: string = `${input.name}.feature.${i}`;
    try {
      if (charts.length >= input.maxCharts)
        throw new Error("feature-chart-work-prefix-exhausted");
      if (!chart.cycles.length)
        throw new Error(
          "Closed feature component requires a separate observation cut strategy",
        );
      let verticesMm: Readonly<AutoMovieVector3Tuple>[] = chart.verticesMm,
        triangles: [number, number, number][] = chart.triangles,
        physicalKeys: string[] = chart.physicalKeys,
        cycle: number[] = chart.cycles[0]!;
      if (chart.cycles.length > 1) {
        const physical: Map<string, string> = new Map(
          chart.occurrenceKeys.map(
            (key: string, id: number): [string, string] => [
              key,
              chart.physicalKeys[id]!,
            ],
          ),
        );
        const disk: ReturnType<IAutoMovieRecoveryMultiBoundaryChart.Operation> =
          M({
            verticesMm,
            triangles,
            vertexKeys: chart.occurrenceKeys,
            cycles: chart.cycles,
          });
        verticesMm = disk.verticesMm;
        triangles = disk.triangles;
        physicalKeys = disk.vertexKeys.map(
          (key: string): string => physical.get(key)!,
        );
        cycle = disk.boundaryCycle;
        if (physicalKeys.some((key: string): boolean => !key))
          throw new Error("An auxiliary cut lost original physical identity");
      }
      const disk: ReturnType<IAutoMovieRecoveryDiskChart.Operation> = D({
        verticesMm,
        triangles,
        vertexKeys: physicalKeys,
        boundaryCycle: cycle,
        cornerDegrees: input.cornerDegrees,
      });
      charts.push({
        name,
        verticesMm: disk.verticesMm,
        triangles: disk.triangles,
        physicalKeys: disk.vertexKeys,
        sides: disk.sides,
        insertions: disk.insertedBoundaryVertices,
        sourceFaces: [...new Set(chart.triangleSourceFaces)],
      });
    } catch (failure: unknown) {
      unsupported.push({
        chart: name,
        sourceFaces: [...new Set(chart.triangleSourceFaces)],
        reason: failure instanceof Error ? failure.message : String(failure),
      });
    }
  }
  return {
    charts,
    unsupported,
    featureArcs: cut.seams.length,
    observationDisplacementUpperMm: cut.observationDisplacementUpperMm,
    diagnostics: [
      ...cut.diagnostics,
      "Feature arc count refers to the validated pre-quarter cut charts; original bank ordinal paths are not final boundary-network witnesses.",
    ],
  };
}
