import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryAtlasObservationFeatures,
  IAutoMovieRecoveryAtlasObservationState,
  IAutoMovieRecoveryFeatureChartPreparation,
} from "@automovie/interface";

import { RecoveryFeatureChartPreparation } from "./RecoveryFeatureChartPreparation";

/**
 * Register feature-prepared charts and their original shared outcome records.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Inventory exits, pending insertion, unsupported counting and first-owner references retain their original order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/development/implementation.md#efficient-algorithms Processes the same feature preparation population with the existing chart budget.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pending entries and the interval ledger retain the identical outcomes array.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Prepared charts transfer to the observation state; no source registry or fit is duplicated.
 */
export function RecoveryAtlasObservationFeatures(
  context: Parameters<IAutoMovieRecoveryAtlasObservationFeatures.Operation>[0],
): ReturnType<IAutoMovieRecoveryAtlasObservationFeatures.Operation> {
  const {
    input,
    name,
    positions,
    triangles,
    vertexIds,
    slots,
    component,
    interval,
    beforeMm,
    afterMm,
    pending,
    inventory,
    outcomes,
    triangleSourceFaces,
    featureEdges,
    failedSelectedComponents,
    incrementUnsupported,
  }: {
    input: IAutoMovieRecoveryAtlasObservationState["Input"];
    name: string;
    positions: Readonly<AutoMovieVector3Tuple>[];
    triangles: [number, number, number][];
    vertexIds: string[];
    slots: Map<string, number>;
    component: IAutoMovieRecoveryAtlasObservationState["Component"];
    interval: number;
    beforeMm: number;
    afterMm: number;
    pending: IAutoMovieRecoveryAtlasObservationState["Pending"][];
    inventory: IAutoMovieRecoveryAtlasObservationState["Inventory"][];
    outcomes: object[];
    triangleSourceFaces: number[];
    featureEdges: IAutoMovieRecoveryAtlasObservationState["Feature"][];
    failedSelectedComponents: Set<string>;
    incrementUnsupported: () => void;
  } = context;
  const prepared: ReturnType<IAutoMovieRecoveryFeatureChartPreparation.Operation> =
    RecoveryFeatureChartPreparation({
      name,
      verticesMm: positions,
      triangles,
      physicalKeys: vertexIds,
      occurrenceKeys: vertexIds.map(
        (key: string): string => `${name}.occurrence.${key}`,
      ),
      triangleSourceFaces,
      featureEdges: featureEdges.map(
        (
          edge: (typeof featureEdges)[number],
        ): Parameters<IAutoMovieRecoveryFeatureChartPreparation.Operation>[0]["featureEdges"][number] => ({
          a: slots.get(edge.from)!,
          b: slots.get(edge.to)!,
          sourceEdge: edge.sourceEdge,
          sourceFaces: edge.sourceFaces,
          angleDegrees: edge.angleDegrees,
        }),
      ),
      cornerDegrees: input.cornerDegrees,
      maxCharts: input.inventoryOnly
        ? Number.MAX_SAFE_INTEGER
        : input.maxCharts - pending.length,
    });
  for (const failed of prepared.unsupported)
    outcomes.push({
      component: component.id,
      chart: null,
      proposedChart: failed.chart,
      sourceFaces: failed.sourceFaces,
      reason: `feature-preparation: ${failed.reason}`,
    });
  if (input.inventoryOnly) {
    for (const chart of prepared.charts)
      inventory.push({
        chart: chart.name,
        component: name,
        vertices: chart.verticesMm.length,
        triangles: chart.triangles.length,
        boundaryObservations: chart.sides.reduce(
          (sum: number, side: number[]): number => sum + side.length,
          0,
        ),
        feature: true,
      });
    outcomes.push({
      component: component.id,
      chart: null,
      sourceFaces: component.faces,
      reason: "inventory-only-feature-candidates-not-fitted",
      candidateCharts: prepared.charts.length,
      unsupportedFeatureCharts: prepared.unsupported.length,
    });
    return;
  }
  for (const chart of prepared.charts)
    pending.push({
      chart,
      interval,
      beforeMm,
      afterMm,
      component: component.id,
      sourceFaces: chart.sourceFaces,
      sourceChart: "feature-cut-four-arc-collar",
      diskConstruction: {
        featureEdges: featureEdges.length,
        featureArcs: prepared.featureArcs,
        featureMidpointDisplacementUpperMm:
          prepared.observationDisplacementUpperMm,
        residualReference:
          "current-private-PL-correspondences; not original-source closest distance",
        originalSourceContinuousDistanceBoundMm: null,
        diagnostics: prepared.diagnostics,
      },
      externalBoundaryAuthorityQualified: false,
      outcomes,
    });
  if (prepared.unsupported.length || !prepared.charts.length) {
    incrementUnsupported();
    failedSelectedComponents.add(`${interval}:${component.id}`);
  }
  return;
}
