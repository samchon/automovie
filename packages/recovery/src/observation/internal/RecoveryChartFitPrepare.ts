import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartControlRelations,
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartFitPrepare,
} from "@automovie/interface";

import { RecoveryChartControlRelations as R } from "./RecoveryChartControlRelations";

/*
 * Admit and normalize one chart before sparse observation assembly.
 */
export function RecoveryChartFitPrepare(
  input: Parameters<IAutoMovieRecoveryChartFitPrepare.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation> {
  const finite: (p: Readonly<AutoMovieVector3Tuple>) => boolean = (
    p: Readonly<AutoMovieVector3Tuple>,
  ): boolean =>
    p?.length === 3 &&
    Number.isFinite(p[0]) &&
    Number.isFinite(p[1]) &&
    Number.isFinite(p[2]);
  const lower: Readonly<AutoMovieVector3Tuple> = input.enclosureMm.lower,
    upper: Readonly<AutoMovieVector3Tuple> = input.enclosureMm.upper;
  if (
    !finite(lower) ||
    !finite(upper) ||
    lower.some((x: number, k: number): boolean => x > upper[k]!) ||
    !Number.isFinite(input.toleranceMm) ||
    !(input.toleranceMm > 0) ||
    !Number.isFinite(input.gradientTolerance) ||
    !(input.gradientTolerance > 0) ||
    !Number.isSafeInteger(input.maxIterations) ||
    input.maxIterations < 1 ||
    !input.controls.length ||
    !input.patches.length ||
    !input.observations.length
  )
    throw new Error(
      "A finite constrained chart and positive fit budgets are required",
    );
  const origin: number[] = lower.map(
    (x: number, k: number): number => x + (upper[k]! - x) / 2,
  );
  const extent: number = Math.max(
    ...upper.map((x: number, k: number): number => x - lower[k]!),
  );
  if (
    !Number.isFinite(extent) ||
    origin.some((value: number): boolean => !Number.isFinite(value))
  )
    throw new Error("Chart enclosure is not representable");
  const scale: number = extent || 1;
  const slots: Int32Array = new Int32Array(input.controls.length).fill(-1);
  for (const p of input.controls)
    if (
      p !== null &&
      (!finite(p) ||
        p.some(
          (x: number, k: number): boolean => x < lower[k]! || x > upper[k]!,
        ))
    )
      throw new Error(
        "Fixed curve controls must lie in the declared enclosure",
      );
  if (input.relations && !input.relationBudget)
    throw new Error(
      "Affine coefficient substitution requires explicit term and depth budgets",
    );
  const maximumRowBudget: number =
    input.relationBudget?.maxRowTerms ?? (input.relations ? 128 : 16);
  if (!Number.isSafeInteger(maximumRowBudget) || maximumRowBudget < 1)
    throw new Error(
      "An explicit positive reduced observation-stencil budget is required",
    );
  if (
    input.relationBudget &&
    (!Number.isSafeInteger(input.relationBudget.maxTerms) ||
      input.relationBudget.maxTerms < 1 ||
      !Number.isSafeInteger(input.relationBudget.maxDepth) ||
      input.relationBudget.maxDepth < 0)
  )
    throw new Error("Affine coefficient term and depth budgets are invalid");
  for (const patch of input.patches) {
    if (patch?.controlIds?.length !== 16)
      throw new Error("Bicubic patches need sixteen valid control identities");
    for (const id of patch.controlIds)
      if (!Number.isSafeInteger(id) || id < 0 || id >= slots.length)
        throw new Error(
          "Bicubic patches need sixteen valid control identities",
        );
    const bounds: typeof patch.parameterBounds = patch.parameterBounds;
    if (bounds !== undefined) {
      if (bounds?.length !== 4)
        throw new Error(
          "Chart patch bounds require ordered normalized U and V intervals",
        );
      const [uMin, uMax, vMin, vMax] = bounds;
      if (
        ![uMin, uMax, vMin, vMax].every(
          (value: number): boolean =>
            Number.isFinite(value) && value >= 0 && value <= 1,
        ) ||
        uMin > uMax ||
        vMin > vMax
      )
        throw new Error(
          "Chart patch bounds require ordered normalized U and V intervals",
        );
    }
  }
  const validSample = (
    sample:
      | IAutoMovieRecoveryChartFit.Input["observations"][number]
      | NonNullable<IAutoMovieRecoveryChartFit.Input["validation"]>[number],
  ): boolean =>
    !!sample &&
    Number.isSafeInteger(sample.patch) &&
    sample.patch >= 0 &&
    sample.patch < input.patches.length &&
    Number.isFinite(sample.u) &&
    sample.u >= 0 &&
    sample.u <= 1 &&
    Number.isFinite(sample.v) &&
    sample.v >= 0 &&
    sample.v <= 1 &&
    finite(sample.pointMm);
  let totalWeight: number = 0;
  for (const sample of input.observations) {
    if (
      !validSample(sample) ||
      !Number.isFinite(sample.weight) ||
      sample.weight <= 0 ||
      sample.pointMm.some(
        (value: number, axis: number): boolean =>
          value < lower[axis]! || value > upper[axis]!,
      )
    )
      throw new Error("Finite chart-local point correspondences are required");
    totalWeight += sample.weight;
  }
  for (const sample of input.validation ?? [])
    if (!validSample(sample))
      throw new Error(
        "Finite chart-local validation correspondences are required",
      );
  if (!Number.isFinite(totalWeight))
    throw new Error("Chart observation weights are not representable");
  const reduced: ReturnType<IAutoMovieRecoveryChartControlRelations.Operation> =
    R({
      controls: input.controls.length,
      fixed: input.controls.flatMap(
        (
          p: Readonly<AutoMovieVector3Tuple> | null,
          id: number,
        ): { id: number; pointMm: Readonly<AutoMovieVector3Tuple> }[] =>
          p === null ? [] : [{ id, pointMm: p }],
      ),
      relations: input.relations ?? [],
      maxTerms: input.relationBudget?.maxTerms ?? 1,
      maxDepth: input.relationBudget?.maxDepth ?? 0,
    });
  const unknowns: number = reduced.independent.length;
  reduced.independent.forEach((id: number, slot: number): void => {
    slots[id] = slot;
  });
  const normalizedConstants: Readonly<AutoMovieVector3Tuple>[] =
    reduced.expressions.map(
      (
        expression: (typeof reduced.expressions)[number],
      ): Readonly<AutoMovieVector3Tuple> => {
        const mass: number = expression.terms.reduce(
          (sum: number, term: { id: number; weight: number }): number =>
            sum + term.weight,
          0,
        );
        return [
          (expression.constant[0]! + origin[0]! * (mass - 1)) / scale,
          (expression.constant[1]! + origin[1]! * (mass - 1)) / scale,
          (expression.constant[2]! + origin[2]! * (mass - 1)) / scale,
        ];
      },
    );
  const basis: (t: number) => number[] = (t: number): number[] => [
    (1 - t) ** 3,
    3 * t * (1 - t) ** 2,
    3 * t ** 2 * (1 - t),
    t ** 3,
  ];

  return {
    finite,
    lower,
    upper,
    origin,
    scale,
    slots,
    maximumRowBudget,
    reduced,
    unknowns,
    normalizedConstants,
    totalWeight,
    basis,
  };
}
