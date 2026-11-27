import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryAtlasObservationSource,
  IAutoMovieRecoveryEventRegion,
  IAutoMovieRecoveryScalarIndex,
  IAutoMovieRecoveryScalarIntervalsSelectionOperation,
} from "@automovie/interface";

import { RecoveryEventRegion } from "./RecoveryEventRegion";
import { RecoveryScalarIndex as I } from "../../internal/RecoveryScalarIndex";
import { AutoMovieRecoveryProfileFitting } from "../../fitting/AutoMovieRecoveryProfileFitting";

/** Admit the immutable source and prepare the selected scalar interval index. */
export function RecoveryAtlasObservationSource(
  input: Parameters<IAutoMovieRecoveryAtlasObservationSource.Operation>[0],
): ReturnType<IAutoMovieRecoveryAtlasObservationSource.Operation> {
  if (
    !input.topologyDomain ||
    input.maxIntervals < 1 ||
    input.maxCharts < 1 ||
    input.levelsMm.length < 2 ||
    input.levelsMm.some(
      (level: number, i: number): boolean =>
        i > 0 && level <= input.levelsMm[i - 1]!,
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
    ].every((value: number): boolean => value > 0) ||
    input.tessellation.maxVertices < 3 ||
    !(input.toleranceMm > 0) ||
    !(input.tessellation.toleranceMm * 0.001 > 0)
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
  const selection: ReturnType<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation> =
    AutoMovieRecoveryProfileFitting.selectScalarIntervals(input.levelsMm, order, input.scalarWindowMm);
  const norm: number = Math.hypot(...input.axis);
  if (!(norm > 0)) throw new Error("A finite sweep direction is required");
  const heights: number[] = input.verticesMm.map(
    (point: Readonly<AutoMovieVector3Tuple>): number =>
      point.reduce(
        (sum: number, x: number, k: number): number =>
          sum + (x * input.axis[k]!) / norm,
        0,
      ),
  );
  const canon: Int32Array = Int32Array.from(
      input.verticesMm,
      (_: Readonly<AutoMovieVector3Tuple>, i: number): number => i,
    ),
    aliases: Map<string, number> = new Map();
  if (input.exactCoordinateAliases)
    input.verticesMm.forEach(
      (point: Readonly<AutoMovieVector3Tuple>, i: number): void => {
        const key: string = point.join(":");
        if (aliases.has(key)) canon[i] = aliases.get(key)!;
        else aliases.set(key, i);
      },
    );
  const region: ReturnType<IAutoMovieRecoveryEventRegion.Operation> =
    RecoveryEventRegion({
      verticesMm: input.verticesMm,
      triangles: input.triangles,
      canon,
      heights,
      incidence: input.exactCoordinateAliases ? "canonical" : "raw",
    });
  const index: ReturnType<IAutoMovieRecoveryScalarIndex.Create> = I.create(
    input.triangles,
    heights,
  );

  return { order, selection, heights, region, index };
}
