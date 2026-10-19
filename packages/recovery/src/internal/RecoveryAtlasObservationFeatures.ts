import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { RecoveryAtlasObservationTypes } from "./RecoveryAtlasObservationTypes";
import { RecoveryFeatureChartPreparation } from "./RecoveryFeatureChartPreparation";

type Input = RecoveryAtlasObservationTypes["Input"];

type Pending = RecoveryAtlasObservationTypes["Pending"];

type Component = RecoveryAtlasObservationTypes["Component"];
type Feature = RecoveryAtlasObservationTypes["Feature"];
type Inventory = RecoveryAtlasObservationTypes["Inventory"];
/**
 * Register feature-prepared charts and their original shared outcome records.
 *
 * @evidence contracts/common.md#principled-implementation Inventory exits, pending insertion, unsupported counting and first-owner references retain their original order.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Processes the same feature preparation population with the existing chart budget.
 * @evidence contracts/performance.md#reuse-equivalent-work Pending entries and the interval ledger retain the identical outcomes array.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prepared charts transfer to the observation state; no source registry or fit is duplicated.
 */
export function RecoveryAtlasObservationFeatures(context: {
  input: Input;
  name: string;
  positions: C.Vector[];
  triangles: [number, number, number][];
  vertexIds: string[];
  slots: Map<string, number>;
  component: Component;
  interval: number;
  beforeMm: number;
  afterMm: number;
  pending: Pending[];
  inventory: Inventory[];
  outcomes: object[];
  triangleSourceFaces: number[];
  featureEdges: Feature[];
  failedSelectedComponents: Set<string>;
  incrementUnsupported: () => void;
}): void {
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
    input: Input;
    name: string;
    positions: C.Vector[];
    triangles: [number, number, number][];
    vertexIds: string[];
    slots: Map<string, number>;
    component: Component;
    interval: number;
    beforeMm: number;
    afterMm: number;
    pending: Pending[];
    inventory: Inventory[];
    outcomes: object[];
    triangleSourceFaces: number[];
    featureEdges: Feature[];
    failedSelectedComponents: Set<string>;
    incrementUnsupported: () => void;
  } = context;
  const prepared: ReturnType<typeof RecoveryFeatureChartPreparation> =
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
        ): Parameters<
          typeof RecoveryFeatureChartPreparation
        >[0]["featureEdges"][number] => ({
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
