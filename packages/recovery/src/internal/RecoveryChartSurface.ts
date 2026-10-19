import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import { RecoveryBezierFit as F } from "./RecoveryBezierFit";
import type { RecoveryChartBoundary } from "./RecoveryChartBoundary";
import { RecoveryChartFit as J } from "./RecoveryChartFit";
import { RecoveryChartLeafFit as L } from "./RecoveryChartLeafFit";
import { RecoveryChartMap as M } from "./RecoveryChartMap";

/**
 * Private four-sided disk observations to a jointly fitted bicubic coefficient atlas.
 * Boundary paths are ordered bottom/right/top/left, with bottom and top increasing u
 * and left and right increasing v. Accepted fitter parameters, rather than input
 * chord fractions, register the private boundary observations to their fitted curves.
 * Shared coefficient identities give C0 continuity only; transverse derivatives,
 * injectivity, source creases and continuous source distance remain unqualified.
 * Unavailable rank diagnostics do not forbid a finite exploratory residual refit
 * when physical-area rows support every unknown and numerical convergence passes.
 * Known rank deficiency remains separate; only a lower original area RMS can
 * replace the preceding area candidate, and point fallback cannot replace it.
 * Optional source PL physical-gradient rows constrain observed slopes softly;
 * they neither impose exact cross-chart G1 nor certify the original embedding.
 *
 * @evidence contracts/common.md#principled-implementation Accepted Bernstein boundaries fix one harmonic Dirichlet chart; physical-area quadrature supplies interior source observations to an affine boundary-collar fit with acyclic hanging-control relations. Residual-driven partition refinement adds unknown coefficients and refits the actual source rather than subdividing the old field alone.
 * @evidence contracts/common.md#clear-and-simple-design Boundary fitting, private parameterization and coefficient fitting have separate numerical owners and reports; only coefficients and patch identities cross the generation seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source triangles supply observations only and never become generated faces. Boundary fits are not silently closed, failed charts are not reversed, and C0 sharing is not labelled a transverse-jet constraint.
 * @evidence contracts/common.md#meaningful-documentation States path direction, accepted-parameter authority, source-private lifetime and separate numerical, continuity and surface-fidelity qualifications.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace initializes no fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No module cache exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observation caller owns returned coefficients and private reports.
 */
export namespace RecoveryChartSurface {
  /**
   * Fit one observed orientable disk whose four boundary paths are already identified.
   * Paths include their shared endpoints and contain private vertex ordinals.
   *
   * @evidence contracts/common.md#principled-implementation Four consistent directed boundary paths define a square Dirichlet problem; exact restriction of each fitted boundary establishes collar boundary controls.
   * @evidence contracts/common.md#clear-and-simple-design All work budgets are explicit and source topology remains local to observation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source normal, replacement source mesh or arbitrary endpoint connection is accepted by the coefficient result.
   * @evidence contracts/common.md#meaningful-documentation The returned private map, fit residuals and controls distinguish observation evidence from the public generated field.
   * @evidence contracts/performance.md#efficient-algorithms Boundary fitting and one O(I(V+E)) harmonic solve precede at most maxRefinements plus one fits. Each fit clips source triangles into at most maxPatches collar leaves and reuses reduced sparse normal equations. Incompatible local edge hierarchies and work limits retain the prior complete area candidate.
   * @evidence contracts/performance.md#reuse-equivalent-work Accepted boundary coefficients, registrations and the private harmonic map are reused across every refit. New knots restrict the same boundary authority; only interior coefficients are solved again against original observations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One chart's source arrays and numerical buffers remain live until return; maxPatches bounds the leaf registry and iteration budgets bound solves without dropping observations.
   */
  export function fit(input: {
    name: string;
    verticesMm: readonly C.Vector[];
    triangles: readonly (readonly [number, number, number])[];
    sides: readonly [
      readonly number[],
      readonly number[],
      readonly number[],
      readonly number[],
    ];
    toleranceMm: number;
    maxSpans: number;
    cornerDegrees: number;
    maxPatches: number;
    maxIterations: number;
    maxObservationRows?: number;
    maxRefinements?: number;
    physicalGradientLengthMm?: number;
    boundaries?: readonly ReturnType<
      ReturnType<typeof RecoveryChartBoundary>["get"]
    >[];
  }): {
    controlsMm: C.Vector[];
    patches: { id: string; controlIds: number[] }[];
    qualified: boolean;
    boundary: F.Result[];
    map: M.Result;
    joint: Omit<J.Result, "controls">;
    partition: { u: number[]; v: number[] };
    continuity: "C0-only";
    leafLayout: ReturnType<typeof L>["leafLayout"];
    areaObservation: {
      qualified: boolean;
      rows: number;
      sourceAreaMm2: number;
      quadratureMinimumRows: number;
      integratedAreaMm2: number | null;
      maximumRelativeAreaDiscrepancy: number | null;
      reason: string | null;
    };
    refinement: {
      rounds: number;
      reason: string;
      residualsMm: number[];
      areaRmsMm: (number | null)[];
      attemptedPatches: number[];
    };
  } {
    const curves: F.Result[] = [],
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
          (id: number): boolean =>
            !Number.isSafeInteger(id) ||
            id < 0 ||
            id >= input.verticesMm.length,
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
      const points: C.Vector[] = ids.map(
          (id: number): C.Vector => input.verticesMm[id]!,
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
      const fitted: F.Result = F.fit(
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
            !Number.isFinite(value) || (i > 0 && value <= values[i - 1]!),
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
    const map: M.Result = M.parameterize({
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
    if (
      !Number.isSafeInteger(maximumRows) ||
      maximumRows < 49 ||
      !Number.isSafeInteger(maximumRefinements) ||
      maximumRefinements < 0
    )
      throw new Error(
        "Finite area-observation and refinement budgets are required",
      );
    const fitted: ReturnType<typeof L> = L({
      name: input.name,
      verticesMm: input.verticesMm,
      triangles: input.triangles,
      parameters: map.parameters,
      curves,
      knots: partitions as [number[], number[], number[], number[]],
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
