import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { RecoveryAtlasObservationTypes } from "./RecoveryAtlasObservationTypes";
import { RecoveryEventRegion } from "./RecoveryEventRegion";
import { RecoveryScalarIndex as I } from "./RecoveryScalarIndex";
import { selectRecoveryScalarIntervals } from "./selectRecoveryScalarIntervals";

type Input = RecoveryAtlasObservationTypes["Input"];

/**
 * Admit the immutable source and prepare the selected scalar interval index.
 *
 * @evidence contracts/common.md#principled-implementation Original policy validation, scalar reduction, exact aliases and event-region construction remain ordered before chart allocation.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits source vertices and triangles once and uses the original selection and indexing operations.
 * @evidence contracts/performance.md#reuse-equivalent-work All later intervals share this prepared region and scalar index.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source metadata lives for this observation call; returned references are private and never become engine geometry.
 */
export function RecoveryAtlasObservationSource(input: Input): {
  order: readonly number[];
  selection: ReturnType<typeof selectRecoveryScalarIntervals>;
  heights: number[];
  region: ReturnType<typeof RecoveryEventRegion>;
  index: ReturnType<typeof I.create>;
} {
  if (
    !input.topologyDomain ||
    !Number.isSafeInteger(input.maxIntervals) ||
    input.maxIntervals < 1 ||
    !Number.isSafeInteger(input.maxCharts) ||
    input.maxCharts < 1 ||
    input.levelsMm.length < 2 ||
    input.levelsMm.some(
      (level: number, i: number): boolean =>
        !Number.isFinite(level) || (i > 0 && level <= input.levelsMm[i - 1]!),
    )
  )
    throw new Error(
      "Increasing automatic levels and positive observation budgets are required",
    );
  if (
    ![
      input.maxSpans,
      input.maxPatchesPerChart,
      input.maxIterations,
      input.tessellation.maxCells,
    ].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    !Number.isSafeInteger(input.tessellation.maxVertices) ||
    input.tessellation.maxVertices < 3 ||
    !(input.toleranceMm > 0 && Number.isFinite(input.toleranceMm)) ||
    !(
      input.tessellation.toleranceMm * 0.001 > 0 &&
      Number.isFinite(input.tessellation.toleranceMm)
    )
  )
    throw new Error(
      "Finite positive fit and realization budgets are required before source observation",
    );
  const order: readonly number[] =
    input.intervalOrder ??
    Array.from(
      { length: input.levelsMm.length - 1 },
      (_: unknown, i: number): number => i,
    );
  const selection: ReturnType<typeof selectRecoveryScalarIntervals> =
    selectRecoveryScalarIntervals(input.levelsMm, order, input.scalarWindowMm);
  const norm: number = Math.hypot(...input.axis);
  if (!(norm > 0 && Number.isFinite(norm)))
    throw new Error("A finite sweep direction is required");
  const heights: number[] = input.verticesMm.map((point: C.Vector): number =>
    point.reduce(
      (sum: number, x: number, k: number): number =>
        sum + (x * input.axis[k]!) / norm,
      0,
    ),
  );
  const canon: Int32Array = Int32Array.from(
      input.verticesMm,
      (_: C.Vector, i: number): number => i,
    ),
    aliases: Map<string, number> = new Map();
  if (input.exactCoordinateAliases)
    input.verticesMm.forEach((point: C.Vector, i: number): void => {
      const key: string = point.join(":");
      if (aliases.has(key)) canon[i] = aliases.get(key)!;
      else aliases.set(key, i);
    });
  const region: ReturnType<typeof RecoveryEventRegion> = RecoveryEventRegion({
    verticesMm: input.verticesMm,
    triangles: input.triangles,
    canon,
    heights,
    incidence: input.exactCoordinateAliases ? "canonical" : "raw",
  });
  const index: ReturnType<typeof I.create> = I.create(input.triangles, heights);

  return { order, selection, heights, region, index };
}
