import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

import type { RecoveryAtlasObservationTypes } from "./RecoveryAtlasObservationTypes";
import { RecoveryChartAssembly } from "./RecoveryChartAssembly";
import { RecoveryChartBatch as B } from "./RecoveryChartBatch";
import { RecoveryChartBoundary } from "./RecoveryChartBoundary";
import type { observeAutoMovieRecoveryAtlas } from "./observeAutoMovieRecoveryAtlas";
import { selectRecoveryScalarIntervals } from "./selectRecoveryScalarIntervals";

type Input = RecoveryAtlasObservationTypes["Input"];
type Prepared = RecoveryAtlasObservationTypes["Prepared"];
type Pending = RecoveryAtlasObservationTypes["Pending"];

type Inventory = RecoveryAtlasObservationTypes["Inventory"];
/**
 * Fit the completely registered selected domain and publish its canonical assembly and coverage.
 *
 * @evidence contracts/common.md#principled-implementation One batch follows all interval registration; original result reductions, assembly fallback diagnostics and coefficient conversion retain their sequence.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Uses the original batch and assembly owners and scans their reports once.
 * @evidence contracts/performance.md#reuse-equivalent-work Fit reports and the original shared outcomes arrays reuse the same pending chart ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned geometry and private reports transfer to the caller; no fit, publication or source resource is retained globally.
 */
export function RecoveryAtlasObservationPublish(context: {
  input: Input;
  pending: Pending[];
  boundaryOwner: ReturnType<typeof RecoveryChartBoundary>;
  fittedCharts: Parameters<typeof RecoveryChartAssembly>[0][number][];
  controls: IAutoMovieBicubicAtlasGeometry["controls"];
  patches: IAutoMovieBicubicAtlasGeometry["patches"];
  charts: object[];
  privateLedger: object[];
  representedFaces: Set<number>;
  encounteredFaces: Set<number>;
  failedSelectedComponents: Set<string>;
  sourceNormals: number[][];
  inventory: Inventory[];
  order: readonly number[];
  selection: ReturnType<typeof selectRecoveryScalarIntervals>;
  visitedIntervalIds: number[];
  visitedIntervals: number;
  visitedComponents: number;
  incrementUnsupported: () => void;
  unsupportedCount: () => number;
  observe: ((record: object) => void) | undefined;
}): ReturnType<typeof observeAutoMovieRecoveryAtlas> {
  const {
    input,
    pending,
    boundaryOwner,
    fittedCharts,
    controls,
    patches,
    charts,
    privateLedger,
    representedFaces,
    encounteredFaces,
    failedSelectedComponents,
    sourceNormals,
    inventory,
    order,
    selection,
    visitedIntervalIds,
    visitedIntervals,
    visitedComponents,
    incrementUnsupported,
    unsupportedCount,
    observe,
  }: {
    input: Input;
    pending: Pending[];
    boundaryOwner: ReturnType<typeof RecoveryChartBoundary>;
    fittedCharts: Parameters<typeof RecoveryChartAssembly>[0][number][];
    controls: IAutoMovieBicubicAtlasGeometry["controls"];
    patches: IAutoMovieBicubicAtlasGeometry["patches"];
    charts: object[];
    privateLedger: object[];
    representedFaces: Set<number>;
    encounteredFaces: Set<number>;
    failedSelectedComponents: Set<string>;
    sourceNormals: number[][];
    inventory: Inventory[];
    order: readonly number[];
    selection: ReturnType<typeof selectRecoveryScalarIntervals>;
    visitedIntervalIds: number[];
    visitedIntervals: number;
    visitedComponents: number;
    incrementUnsupported: () => void;
    unsupportedCount: () => number;
    observe: ((record: object) => void) | undefined;
  } = context;
  // All selected chart families register their physical subarcs before any fit.
  const pendingByName: Map<string, Pending> = new Map(
    pending.map((prepared: Pending): [string, Pending] => [
      prepared.chart.name,
      prepared,
    ]),
  );
  const batch: ReturnType<typeof B> = B({
    charts: pending.map((prepared: Pending): Prepared => prepared.chart),
    owner: boundaryOwner,
    fit: {
      toleranceMm: input.toleranceMm,
      maxSpans: input.maxSpans,
      cornerDegrees: input.cornerDegrees,
      maxPatches: input.maxPatchesPerChart,
      maxIterations: input.maxIterations,
      maxObservationRows: input.maxObservationRowsPerChart,
      maxRefinements: input.maxRefinementsPerChart,
      physicalGradientLengthMm: input.physicalGradientLengthMm,
    },
  });
  for (const result of batch) {
    const prepared: Pending | undefined = pendingByName.get(result.name);
    if (!prepared)
      throw new Error("A common-network result lost its private source owner");
    if (!result.fit || !result.chart) {
      prepared.outcomes.push({
        component: prepared.component,
        chart: null,
        proposedChart: result.name,
        sourceFaces: prepared.sourceFaces,
        reason: result.reason,
      });
      const key: string = `${prepared.interval}:${prepared.component}`;
      if (!failedSelectedComponents.has(key)) {
        failedSelectedComponents.add(key);
        incrementUnsupported();
      }
      continue;
    }
    const fit: NonNullable<typeof result.fit> = result.fit,
      chart: NonNullable<typeof result.chart> = result.chart;
    fittedCharts.push({
      name: result.name,
      controlsMm: fit.controlsMm,
      patches: fit.patches,
      partition: fit.partition,
      boundaries: chart.boundaries,
      leafLayout: fit.leafLayout,
    });
    const offset: number = controls.length;
    for (const point of fit.controlsMm)
      controls.push({
        x: point[0] * 0.001,
        y: point[1] * 0.001,
        z: point[2] * 0.001,
      });
    for (const patch of fit.patches)
      patches.push({
        id: patch.id,
        controlIds: patch.controlIds.map((id: number): number => offset + id),
      });
    charts.push({
      id: result.name,
      interval: prepared.interval,
      beforeMm: prepared.beforeMm,
      afterMm: prepared.afterMm,
      qualified: fit.qualified,
      patches: fit.patches.map(
        (patch: (typeof fit.patches)[number]): string => patch.id,
      ),
      joint: fit.joint,
      areaObservation: fit.areaObservation,
      refinement: fit.refinement,
      map: {
        qualified: fit.map.qualified,
        residual: fit.map.residual,
        failedTriangles: fit.map.failedTriangles.length,
      },
      continuity: fit.continuity,
      partition: fit.partition,
      leafBounds: fit.leafLayout.leaves.map(
        (leaf: (typeof fit.leafLayout.leaves)[number]): number[] => leaf.bounds,
      ),
      counts: {
        privateObservationVertices: chart.verticesMm.length,
        privateObservationTriangles: chart.triangles.length,
        coefficients: fit.controlsMm.length,
        patches: fit.patches.length,
        boundaryObservations: chart.sides.reduce(
          (sum: number, side: number[]): number => sum + side.length,
          0,
        ),
        boundarySpans: fit.boundary.reduce(
          (sum: number, row: (typeof fit.boundary)[number]): number =>
            sum + row.curve.spans.length,
          0,
        ),
      },
      sourceChart: prepared.sourceChart,
      diskConstruction: prepared.diskConstruction,
      commonBoundaryNetwork: {
        scope: "entire-selected-chart-domain",
        succeeded: result.sharedBoundaryQualified,
        networkMeasuredPointChangeMm: result.networkMaximumPointChangeMm,
        diagnostics: result.diagnostics,
      },
      physicalGradientLengthMm: input.physicalGradientLengthMm ?? 0,
      externalBoundaryAuthorityQualified:
        prepared.externalBoundaryAuthorityQualified &&
        result.sharedBoundaryQualified,
      boundary: fit.boundary.map(
        (boundary: (typeof fit.boundary)[number], side: number): object => ({
          authorityId: chart.boundaries[side]!.id,
          reversed: chart.boundaries[side]!.reversed,
          cornerIds: chart.boundaries[side]!.corners,
          curve: boundary.curve,
          toleranceMet: boundary.toleranceMet,
          sampleMaximumMm: boundary.sampleMaximumMm,
          polylineUpperEstimateMm: boundary.polylineUpperEstimateMm,
        }),
      ),
      externalJoins:
        "all-selected-families-share-declared-physical-subarcs; physical-gradient-fit-is-not-exact-G1; global-neighbor-and-cut-bank-qualification-remains-explicit",
    });
    for (const face of prepared.sourceFaces) representedFaces.add(face);
    prepared.outcomes.push({
      component: prepared.component,
      chart: result.name,
      sourceFaces: prepared.sourceFaces,
      qualified: fit.qualified,
      reason: null,
      sourceFaceScope:
        "At least one clipped feature/chart part; not complete original-face area",
    });
    observe?.({
      phase: "common-network-chart-fit",
      chart: result.name,
      representedCharts: charts.length,
      pendingCharts: pending.length,
      rows: fit.areaObservation.rows,
      unknownControls: fit.joint.unknownControls,
      physicalJetRows: fit.joint.physicalJetRows,
      iterations: fit.joint.iterations,
    });
  }
  let assembly:
    | Omit<ReturnType<typeof RecoveryChartAssembly>, "controlsMm" | "patches">
    | { diagnostics: string[]; failed: true };
  let boundaryAuthorities: IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"],
    boundaryBindings: IAutoMovieBicubicAtlasGeometry["boundaryBindings"];
  try {
    const merged: ReturnType<typeof RecoveryChartAssembly> =
      RecoveryChartAssembly(fittedCharts);
    boundaryAuthorities = merged.boundaryAuthorities;
    boundaryBindings = merged.boundaryBindings;
    controls.length = 0;
    patches.length = 0;
    for (const point of merged.controlsMm)
      controls.push({
        x: point[0] * 0.001,
        y: point[1] * 0.001,
        z: point[2] * 0.001,
      });
    for (const patch of merged.patches) patches.push(patch);
    assembly = {
      diagnostics: merged.diagnostics,
      maximumCanonicalRestrictionDifferenceMm:
        merged.maximumCanonicalRestrictionDifferenceMm,
      sharedBoundarySpans: merged.sharedBoundarySpans,
      unmatchedBoundarySpans: merged.unmatchedBoundarySpans,
    };
  } catch (failure: unknown) {
    assembly = {
      failed: true,
      diagnostics: [
        `Canonical boundary assembly failed; finite independently fitted charts retained: ${failure instanceof Error ? failure.message : String(failure)}`,
      ],
    };
  }
  const fitReports: {
    id: string;
    qualified: boolean;
    externalBoundaryAuthorityQualified: boolean;
    patches: string[];
    joint: { maximumMm: number; diagnostics: string[] };
  }[] = charts as {
    id: string;
    qualified: boolean;
    externalBoundaryAuthorityQualified: boolean;
    patches: string[];
    joint: { maximumMm: number; diagnostics: string[] };
  }[];
  const assemblyDifferenceMm: number =
    "failed" in assembly ? 0 : assembly.maximumCanonicalRestrictionDifferenceMm;
  const assemblyQualified: boolean =
    !("failed" in assembly) && assembly.unmatchedBoundarySpans === 0;
  const sourceAreaMm2: number = sourceNormals.reduce(
    (sum: number, normal: number[]): number => sum + Math.hypot(...normal) / 2,
    0,
  );
  return {
    geometry: {
      type: "bicubic-atlas",
      topologyDomain: input.topologyDomain,
      controls,
      patches,
      boundaryAuthorities,
      boundaryBindings,
      tolerance: input.tessellation.toleranceMm * 0.001,
      maxCells: input.tessellation.maxCells,
      maxVertices: input.tessellation.maxVertices,
      cellBudgetPolicy: input.tessellation.cellBudgetPolicy,
      sourceFit: {
        qualified:
          assemblyQualified &&
          fitReports.length > 0 &&
          fitReports.every(
            (report: (typeof fitReports)[number]): boolean =>
              report.qualified &&
              report.externalBoundaryAuthorityQualified &&
              report.joint.maximumMm + assemblyDifferenceMm <=
                input.toleranceMm,
          ),
        maximumResidual: fitReports.length
          ? (assemblyDifferenceMm +
              fitReports.reduce(
                (
                  maximum: number,
                  report: (typeof fitReports)[number],
                ): number => Math.max(maximum, report.joint.maximumMm),
                0,
              )) *
            0.001
          : null,
        unqualifiedPatches: fitReports
          .filter(
            (report: (typeof fitReports)[number]): boolean =>
              !report.qualified || !report.externalBoundaryAuthorityQualified,
          )
          .flatMap(
            (report: (typeof fitReports)[number]): string[] => report.patches,
          ),
        diagnostics: [
          "Reported residuals address current private PL correspondences; midpoint and quarter observations may have separately recorded binary64 displacement. They are not original-source closest distances or continuous bounds.",
          ...assembly.diagnostics,
          ...fitReports
            .filter(
              (report: (typeof fitReports)[number]): boolean =>
                !report.externalBoundaryAuthorityQualified,
            )
            .map(
              (report: (typeof fitReports)[number]): string =>
                `${report.id}: general disk subarc and private cut-seam boundary authorities remain unqualified`,
            ),
          ...fitReports.flatMap(
            (report: (typeof fitReports)[number]): string[] =>
              report.joint.diagnostics.map(
                (diagnostic: string): string => `${report.id}: ${diagnostic}`,
              ),
          ),
        ],
      },
    },
    charts,
    coverage: {
      complete: false,
      inventoryOnly: input.inventoryOnly === true,
      inventoryCandidates: inventory,
      inventoryCandidateCharts: inventory.length,
      plannedIntervals: selection.intervals.length,
      sourceIntervals: order.length,
      excludedIntervalsByWindow: selection.excludedIntervals,
      scalarWindowMm: selection.windowMm,
      plannedWholeSlabBoundsMm: selection.wholeSlabBoundsMm,
      visitedIntervals,
      unvisitedIntervals: selection.intervals.length - visitedIntervals,
      visitedComponents,
      representedCharts: charts.length,
      preparedCharts: pending.length,
      commonBoundaryScope: "entire-selected-chart-domain",
      physicalGradientLengthMm: input.physicalGradientLengthMm ?? 0,
      unsupportedComponents: unsupportedCount(),
      encounteredSourceFaces: encounteredFaces.size,
      representedSourceFaces: representedFaces.size,
      sourceFaces: input.triangles.length,
      faceCountMeaning:
        "unique faces with at least one visited or fitted clipped cell; not complete original-face coverage",
      sourceAreaMm2,
      sourceAreaScope:
        "entire immutable input mesh, not the scalar-window or head denominator",
      sharedBoundaries: boundaryOwner.size(),
      boundaryAssembly: assembly,
      chartAreasMm2: charts.map(
        (chart: object): number | null =>
          (chart as { areaObservation: { sourceAreaMm2: number | null } })
            .areaObservation.sourceAreaMm2,
      ),
      intervalWidthsMm: visitedIntervalIds.map(
        (id: number): number => input.levelsMm[id + 1]! - input.levelsMm[id]!,
      ),
      unsupportedKinds: [
        "nonorientable, nonmanifold or positive-genus components",
        "private cut graphs or harmonic maps failing their incidence and signed-area checks",
        "plane strata",
        "feature-cut or quarter-network admissions failing their private incidence, arithmetic or UV checks",
        "partial quarter-arc and duplicated cut-fan boundary authorities",
        "external physical C1/G1 jets",
        "unregistered external partial-arc or phase correspondence",
        "closed/ruled seam coupling",
      ],
      visitedIntervalIds,
      unvisitedIntervalIds: selection.intervals.slice(visitedIntervals),
    },
    privateLedger,
  };
}
