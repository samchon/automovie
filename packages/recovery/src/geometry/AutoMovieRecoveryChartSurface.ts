import type {
  AutoMovieVector3Tuple,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryChartLeafFit,
  IAutoMovieRecoveryChartMap,
  IAutoMovieRecoveryChartSurface,
} from "@automovie/interface";

import { AutoMovieRecoveryBezierFit as F } from "../fitting/AutoMovieRecoveryBezierFit";
import { RecoveryChartLeafFit as L } from "../observation/internal/RecoveryChartLeafFit";
import { AutoMovieRecoveryChartMap as M } from "./AutoMovieRecoveryChartMap";

/**
 * Private four-sided disk observations to a jointly fitted bicubic coefficient
 * atlas. Boundary paths are ordered bottom/right/top/left, with bottom and top
 * increasing u and left and right increasing v. Accepted fitter parameters,
 * rather than input chord fractions, register the private boundary observations
 * to their fitted curves. Shared coefficient identities give C0 continuity
 * only; transverse derivatives, injectivity, source creases and continuous
 * source distance remain unqualified. Unavailable rank diagnostics do not
 * forbid a finite exploratory residual refit when physical-area rows support
 * every unknown and numerical convergence passes. Known rank deficiency remains
 * separate; only a lower original area RMS can replace the preceding area
 * candidate, and point fallback cannot replace it. Optional source PL
 * physical-gradient rows constrain observed slopes softly; they neither impose
 * exact cross-chart G1 nor certify the original embedding.
 */
export namespace AutoMovieRecoveryChartSurface {
  /**
   * Fit one observed orientable disk whose four boundary paths are already
   * identified. Paths include their shared endpoints and contain private vertex
   * ordinals.
   */
  export function fit(
    input: Parameters<IAutoMovieRecoveryChartSurface.Fit>[0],
  ): ReturnType<IAutoMovieRecoveryChartSurface.Fit> {
    const curves: IAutoMoviePolylineFit[] = [],
      registrations: number[][] = [],
      partitions: number[][] = [];
    for (let side: number = 0; side < 4; side++) {
      const ids: readonly number[] = input.sides[side]!,
        accepted: {
          span: number;
          first: number;
          last: number;
          parameters: readonly number[];
        }[] = [];
      if (
        ids.length < 2 ||
        ids.some(
          (id: number): boolean => id < 0 || id >= input.verticesMm.length,
        )
      )
        throw new Error("Four nonempty private boundary paths are required");
      if (input.boundaries) {
        if (input.boundaries.length !== 4)
          throw new Error(
            "A shared authority must supply all four chart boundaries",
          );
        const boundary: NonNullable<typeof input.boundaries>[number] =
          input.boundaries[side]!;
        if (
          boundary.parameters.length !== ids.length ||
          boundary.knots.length !== boundary.fit.curve.spans.length + 1
        )
          throw new Error(
            "Shared boundary registration does not address every private observation",
          );
        curves.push(boundary.fit);
        registrations.push([...boundary.parameters]);
        partitions.push([...boundary.knots]);
        continue;
      }
      const points: Readonly<AutoMovieVector3Tuple>[] = ids.map(
          (id: number): Readonly<AutoMovieVector3Tuple> =>
            input.verticesMm[id]!,
        ),
        corners: number[] = [];
      for (let i: number = 1; i + 1 < points.length; i++) {
        const a: number[] = points[i]!.map(
            (x: number, k: number): number => x - points[i - 1]![k]!,
          ),
          b: number[] = points[i + 1]!.map(
            (x: number, k: number): number => x - points[i]![k]!,
          );
        const denominator: number = Math.hypot(...a) * Math.hypot(...b);
        if (!(denominator > 0))
          throw new Error(
            "A private boundary path has a collapsed observation edge",
          );
        const cosine: number =
          a.reduce(
            (sum: number, x: number, k: number): number => sum + x * b[k]!,
            0,
          ) / denominator;
        if (
          (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI >=
          input.cornerDegrees
        )
          corners.push(i);
      }
      const fitted: IAutoMoviePolylineFit = F.fit(
        {
          name: `${input.name}.boundary.${side}`,
          pointsMm: points,
          closed: false,
          corners,
          toleranceMm: input.toleranceMm,
          maxSpans: input.maxSpans,
          parameterization: "chord",
        },
        (
          span: number,
          first: number,
          last: number,
          parameters: readonly number[],
        ): void => {
          accepted.push({ span, first, last, parameters });
        },
      );
      const widths: readonly number[] = fitted.curve.phaseIntervals,
        total: number = widths.reduce(
          (sum: number, width: number): number => sum + width,
          0,
        ),
        knots: number[] = [0];
      for (const width of widths) knots.push(knots.at(-1)! + width / total);
      knots[knots.length - 1] = 1;
      const values: number[] = new Array(ids.length).fill(NaN);
      for (const row of accepted)
        for (let i: number = row.first; i <= row.last; i++)
          values[i] =
            knots[row.span]! +
            (knots[row.span + 1]! - knots[row.span]!) *
              row.parameters[i - row.first]!;
      values[0] = 0;
      values[values.length - 1] = 1;
      if (
        values.some(
          (value: number, i: number): boolean =>
            i > 0 && value <= values[i - 1]!,
        )
      )
        throw new Error(
          "Accepted boundary fit parameters are not a strictly ordered chart",
        );
      curves.push(fitted);
      registrations.push(values);
      partitions.push(knots);
    }
    const fixed: Map<number, { vertex: number; u: number; v: number }> =
      new Map();
    input.sides.forEach((ids: readonly number[], side: number): void =>
      ids.forEach((vertex: number, i: number): void => {
        const value: number = registrations[side]![i]!,
          pair: [number, number] =
            side === 0
              ? [value, 0]
              : side === 1
                ? [1, value]
                : side === 2
                  ? [value, 1]
                  : [0, value];
        const previous: { vertex: number; u: number; v: number } | undefined =
          fixed.get(vertex);
        if (previous && (previous.u !== pair[0] || previous.v !== pair[1]))
          throw new Error("Boundary paths disagree at a private chart corner");
        fixed.set(vertex, { vertex, u: pair[0], v: pair[1] });
      }),
    );
    const map: IAutoMovieRecoveryChartMap.Result = M.parameterize({
      vertices: input.verticesMm.length,
      triangles: input.triangles,
      fixed: [...fixed.values()],
      tolerance: 1e-10,
      maxIterations: input.maxIterations,
    });
    if (!map.qualified)
      throw new Error(
        `Unqualified private harmonic chart: ${map.diagnostics.join("; ")}`,
      );
    const maximumRows: number = input.maxObservationRows ?? 250_000,
      maximumRefinements: number = input.maxRefinements ?? 4;
    if (maximumRows < 49 || maximumRefinements < 0)
      throw new Error(
        "Finite area-observation and refinement budgets are required",
      );
    const fitted: ReturnType<IAutoMovieRecoveryChartLeafFit.Operation> = L({
      name: input.name,
      verticesMm: input.verticesMm,
      triangles: input.triangles,
      parameters: map.parameters,
      curves,
      knots: [partitions[0]!, partitions[1]!, partitions[2]!, partitions[3]!],
      toleranceMm: input.toleranceMm,
      maxPatches: input.maxPatches,
      maxIterations: input.maxIterations,
      maxObservationRows: maximumRows,
      maxRefinements: maximumRefinements,
      physicalGradientLengthMm: input.physicalGradientLengthMm,
    });
    return {
      ...fitted,
      boundary: curves,
      map,
      partition: {
        u: [...new Set([...partitions[0]!, ...partitions[2]!])].sort(
          (a: number, b: number): number => a - b,
        ),
        v: [...new Set([...partitions[1]!, ...partitions[3]!])].sort(
          (a: number, b: number): number => a - b,
        ),
      },
      continuity: "C0-only",
    };
  }
}
