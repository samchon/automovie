import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import { RecoveryChartControlRelations as R } from "./RecoveryChartControlRelations";
import type { RecoveryChartFit } from "./RecoveryChartFit";

type Input = RecoveryChartFit.Input;

/**
 * Admit and normalize one chart before sparse observation assembly.
 *
 * @evidence contracts/common.md#principled-implementation The enclosure origin, physical scale and affine coefficient substitution retain their original arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits controls, relations, patches and observation weights with the original reduction and relation budgets.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned normalization and reduced expressions serve assembly, solve and report.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-owned normalized coefficients and relation maps transfer to the fit orchestrator without global storage.
 */
export function RecoveryChartFitPrepare(input: Input): {
  finite: (p: C.Vector) => boolean;
  lower: C.Vector;
  upper: C.Vector;
  origin: number[];
  scale: number;
  slots: Int32Array;
  maximumRowBudget: number;
  reduced: ReturnType<typeof R>;
  unknowns: number;
  normalizedConstants: C.Vector[];
  totalWeight: number;
  basis: (t: number) => number[];
} {
  const finite: (p: C.Vector) => boolean = (p: C.Vector): boolean =>
    p.length === 3 && p.every(Number.isFinite);
  const lower: C.Vector = input.enclosureMm.lower,
    upper: C.Vector = input.enclosureMm.upper;
  if (
    !finite(lower) ||
    !finite(upper) ||
    lower.some((x: number, k: number): boolean => x > upper[k]!) ||
    !(input.toleranceMm > 0 && Number.isFinite(input.toleranceMm)) ||
    !(
      input.gradientTolerance > 0 && Number.isFinite(input.gradientTolerance)
    ) ||
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
  if (!origin.every(Number.isFinite) || !Number.isFinite(extent))
    throw new Error("Chart enclosure is not representable");
  const scale: number = extent || 1;
  const slots: Int32Array = new Int32Array(input.controls.length).fill(-1);
  input.controls.forEach((p: C.Vector | null): void => {
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
  });
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
  const reduced: ReturnType<typeof R> = R({
    controls: input.controls.length,
    fixed: input.controls.flatMap(
      (p: C.Vector | null, id: number): { id: number; pointMm: C.Vector }[] =>
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
  const normalizedConstants: C.Vector[] = reduced.expressions.map(
    (expression: (typeof reduced.expressions)[number]): C.Vector => {
      const mass: number = expression.terms.reduce(
        (sum: number, term: { id: number; weight: number }): number =>
          sum + term.weight,
        0,
      );
      return [0, 1, 2].map(
        (k: number): number =>
          (expression.constant[k]! + origin[k]! * (mass - 1)) / scale,
      ) as [number, number, number];
    },
  );
  for (const patch of input.patches)
    if (
      patch.controlIds.length !== 16 ||
      patch.controlIds.some(
        (id: number): boolean =>
          !Number.isSafeInteger(id) || id < 0 || id >= slots.length,
      )
    )
      throw new Error("Bicubic patches need sixteen valid control identities");
  const totalWeight: number = input.observations.reduce(
    (sum: number, row: Input["observations"][number]): number =>
      sum + row.weight,
    0,
  );
  if (!(totalWeight > 0 && Number.isFinite(totalWeight)))
    throw new Error("Chart observation weights are not representable");
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
