import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import { RecoveryDiskChart as D } from "./RecoveryDiskChart";
import { RecoveryFeatureChartCuts as F } from "./RecoveryFeatureChartCuts";
import { RecoveryMultiBoundaryChart as M } from "./RecoveryMultiBoundaryChart";

/**
 * Prepare privately cut feature banks for a common four-arc boundary network.
 * Unique occurrence keys guide auxiliary cuts; repeated physical keys retain
 * source identity without welding private fans. Every output remains an observation
 * chart. Closed components and failed topology or disk admissions stay unsupported.
 *
 * @evidence contracts/common.md#principled-implementation Declared source-face features materialize coherent banks, genus-zero multiple boundaries use a validated cut forest, and physical-arclength quarters define four directed observation paths.
 * @evidence contracts/common.md#clear-and-simple-design This private adapter composes three topology owners and preserves physical versus occurrence identity for the later shared-curve network and field fit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source face, normal, physical word or source triangulation is published as engine geometry. Failed chart preparation is recorded rather than replaced by a source patch.
 * @evidence contracts/common.md#meaningful-documentation States private lifetime, occurrence identity, auxiliary cut semantics, unsupported closed components and the separate boundary and UV qualifications.
 * @evidence contracts/performance.md#efficient-algorithms Feature incidence is processed once. Each resulting component invokes at most one bounded cut-forest and one quarter operation; total input faces are partitioned rather than duplicated between feature components.
 * @evidence contracts/performance.md#reuse-equivalent-work Fan-separated charts and original physical keys serve both auxiliary topology and later boundary authority without reclassifying normals or reconstructing source incidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned observation arrays and seam witnesses remain private and caller-owned. Component-local maps expire on return; no public mesh or task handle is created.
 */
export function RecoveryFeatureChartPreparation(
  input: Parameters<typeof F>[0] & {
    name: string;
    cornerDegrees: number;
    maxCharts: number;
  },
): {
  charts: {
    name: string;
    verticesMm: C.Vector[];
    triangles: [number, number, number][];
    physicalKeys: string[];
    sides: [number[], number[], number[], number[]];
    insertions: ReturnType<typeof D>["insertedBoundaryVertices"];
    sourceFaces: number[];
  }[];
  unsupported: { chart: string; reason: string; sourceFaces: number[] }[];
  featureArcs: number;
  observationDisplacementUpperMm: number;
  diagnostics: string[];
} {
  if (!Number.isSafeInteger(input.maxCharts) || input.maxCharts < 0)
    throw new Error(
      "Feature preparation needs an explicit remaining chart budget",
    );
  const cut: ReturnType<typeof F> = F(input),
    charts: ReturnType<typeof RecoveryFeatureChartPreparation>["charts"] = [],
    unsupported: ReturnType<
      typeof RecoveryFeatureChartPreparation
    >["unsupported"] = [];
  for (let i: number = 0; i < cut.charts.length; i++) {
    const chart: ReturnType<typeof F>["charts"][number] = cut.charts[i]!,
      name: string = `${input.name}.feature.${i}`;
    try {
      if (charts.length >= input.maxCharts)
        throw new Error("feature-chart-work-prefix-exhausted");
      if (!chart.cycles.length)
        throw new Error(
          "Closed feature component requires a separate observation cut strategy",
        );
      let verticesMm: C.Vector[] = chart.verticesMm,
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
        const disk: ReturnType<typeof M> = M({
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
      const disk: ReturnType<typeof D> = D({
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
