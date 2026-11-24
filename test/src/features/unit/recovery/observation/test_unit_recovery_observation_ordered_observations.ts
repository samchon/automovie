import type {
  IAutoMovieRecoveryOrderedCuts,
  IAutoMovieRecoveryOrderedLineage,
  IAutoMovieRecoverySavedCurveBinding,
  IAutoMovieRecoverySectionsInput,
  IAutoMovieRecoverySourceLineage,
} from "@automovie/interface";
import {
  AutoMovieRecoveryOrderedLineage,
  observeAutoMovieRecoveryPolyline,
  observeAutoMovieRecoverySections,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Ordered source cuts bind a new replay without replacing saved coefficients.
 *
 * Scenarios:
 * 1. A tetrahedron cut at Y=1 has three sides and perimeter 4+sqrt(8) mm.
 * 2. Its saved Hermite coefficients replay exactly, while a changed endpoint refuses correspondence.
 * 3. An ordered straight polyline preserves its two-mm physical phase, and progress-triggered abort at either checkpoint publishes no value.
 */
export function test_unit_recovery_observation_ordered_observations(): void {
  const mesh: IAutoMovieRecoverySectionsInput = {
    name: "ordered-tetrahedron",
    coordinatesMm: [1],
    axis: [0, 1, 0],
    reference: [1, 0, 0],
    verticesMm: [
      [0, 0, 0],
      [3, 0, 0],
      [0, 0, 3],
      [0, 3, 0],
    ],
    triangles: [
      [0, 3, 1],
      [0, 2, 3],
      [0, 1, 2],
      [1, 3, 2],
    ],
    toleranceMm: 0.01,
    maxSpans: 8,
    exactCoordinateAliases: false,
    sourceOrientationSign: 1,
    cornerDegrees: 45,
    includeExactSourceLineage: true,
  };
  const lineage: IAutoMovieRecoverySourceLineage[] = [];
  const observed: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(mesh, {
    curveFormat: "hermite",
    onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
      lineage.push(record);
    },
  });
  if (!("value" in observed))
    throw new Error("Tetrahedron must publish a saved section");
  const input: IAutoMovieRecoveryOrderedLineage.Input = {
    ...mesh,
    sourceIdentity: "verified-source",
    sourceSelectionIdentity: "verified-selection",
    originalTriangleIds: [0, 1, 2, 3],
    savedSections: [
      {
        coordinateMm: 1,
        sourceIdentity: "verified-source",
        sourceSelectionIdentity: "verified-selection",
        observationIdentity: "verified-artifact",
        frame: observed.value.frame,
        exactCoordinateAliases: false,
        sourceLineage: lineage,
      },
    ],
  };
  const cuts: IAutoMovieRecoveryOrderedCuts =
    AutoMovieRecoveryOrderedLineage.observeCuts(input);
  TestValidator.equals(
    "all three directed source edges retained",
    cuts.sections[0]!.contours[0]!.segments.length,
    3,
  );
  TestValidator.predicate(
    "independent triangle perimeter",
    nclose(
      cuts.sections[0]!.contours[0]!.totalPolylineMm,
      4 + Math.sqrt(8),
      1e-12,
    ),
  );
  const curve: IAutoMovieRecoveryOrderedLineage.Target["curve"] =
    observed.value.sections[0]!.loops[0]!.curve;
  const bytes: string = JSON.stringify(curve);
  const target: IAutoMovieRecoveryOrderedLineage.Target = {
    coordinateMm: 1,
    contourIndex: 0,
    observationIdentity: "verified-artifact",
    curve,
    policy: {
      toleranceMm: mesh.toleranceMm,
      maxSpans: mesh.maxSpans,
      cornerDegrees: mesh.cornerDegrees,
      sourceOrientationSign: mesh.sourceOrientationSign,
    },
  };
  const bound: IAutoMovieRecoverySavedCurveBinding =
    AutoMovieRecoveryOrderedLineage.bindSavedFits(input, cuts, [target])[0]!;
  TestValidator.equals(
    "same saved geometry binds",
    bound.status,
    "bound-exact-saved-cubic",
  );
  TestValidator.predicate(
    "new accepted samples retained",
    (bound.samples?.length ?? 0) >= 3,
  );
  TestValidator.equals(
    "historical trace is not claimed",
    bound.historicalAcceptedTraceVerified,
    false,
  );
  const changed: typeof target = structuredClone(target);
  if (changed.curve.type !== "cubicHermite")
    throw new Error("Fixture selected Hermite");
  changed.curve = {
    ...changed.curve,
    spans: changed.curve.spans.map(
      (
        span: (typeof changed.curve.spans)[number],
        index: number,
      ): typeof span =>
        index === 0
          ? {
              ...span,
              start: [span.start[0] + 1, span.start[1], span.start[2]],
            }
          : span,
    ),
  };
  const rejected: IAutoMovieRecoverySavedCurveBinding =
    AutoMovieRecoveryOrderedLineage.bindSavedFits(input, cuts, [changed])[0]!;
  TestValidator.equals(
    "changed saved geometry remains unavailable",
    rejected.status,
    "unavailable",
  );
  TestValidator.equals(
    "unavailable correspondence has no samples",
    rejected.samples,
    undefined,
  );
  TestValidator.equals(
    "original coefficients unchanged",
    JSON.stringify(curve),
    bytes,
  );
  const polyline: Parameters<typeof observeAutoMovieRecoveryPolyline>[0] = {
    name: "two-mm-line",
    pointsMm: [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ],
    closed: false,
    corners: [],
    toleranceMm: 0.01,
    maxSpans: 4,
    parameterization: "chord",
  };
  const fit: ReturnType<typeof observeAutoMovieRecoveryPolyline<"hermite">> =
    observeAutoMovieRecoveryPolyline(polyline, { curveFormat: "hermite" });
  if (!("value" in fit)) throw new Error("Straight line must fit");
  TestValidator.predicate(
    "physical line phase stays two mm",
    nclose(
      fit.value.curve.phaseIntervals.reduce(
        (sum: number, h: number): number => sum + h,
        0,
      ),
      2,
      1e-12,
    ),
  );
  for (const checkpoint of [0, 1]) {
    const controller: AbortController = new AbortController();
    const cancelled: ReturnType<
      typeof observeAutoMovieRecoveryPolyline<"hermite">
    > = observeAutoMovieRecoveryPolyline(polyline, {
      curveFormat: "hermite",
      cancelled: (): boolean => controller.signal.aborted,
      onProgress: (_phase: string, completed: number): void => {
        if (completed === checkpoint) controller.abort();
      },
    });
    TestValidator.equals(
      "callback abort cancels",
      cancelled.status,
      "cancelled",
    );
    TestValidator.predicate(
      "callback abort publishes no coefficients",
      !("value" in cancelled),
    );
  }
}
