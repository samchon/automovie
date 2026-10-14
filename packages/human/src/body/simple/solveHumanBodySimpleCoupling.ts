import { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IHumanBodySimpleUnknown } from "./IHumanBodySimpleUnknown";
import { humanBodySimpleCouplingRange } from "./humanBodySimpleCouplingRange";
import { humanBodySimpleResidualsMet } from "./humanBodySimpleResidualsMet";
import { humanBodySimpleShapeDirection as direction } from "./humanBodySimpleShapeDirection";
import { solveHumanBodySimpleOffsets } from "./solveHumanBodySimpleOffsets";

/**
 * Solve requested simple measurements on one shared trial body.
 *
 * Each named metre/kilogram reading depends on several shape directions. This
 * adapter shapes the body once per trial, reads all rows from that same skin,
 * and normalizes their errors by positive targets. The numerical offset solver
 * owns iteration; the basis envelopes own permissible channel weights and each
 * row owns its absolute precision budget. A current shape already meeting
 * every budget needs no derivative body. Inputs are never changed.
 *
 * Null means an unreadable, fixed, singular or unconverged system. Expansion
 * then uses its strict sequential inverse, retaining its complete endpoint
 * samples and named reach refusal. A successful result must still pass the
 * final shared-body measurement assertion after stature reconciliation.
 *
 * @evidence contracts/common.md#principled-implementation Normalize finite readings by positive targets on a common trial body, constrain each scalar by current channel envelopes and delegate simultaneous bounded inversion; empty and already-met systems return shape copies.
 * @evidence contracts/common.md#clear-and-simple-design The adapter owns shape directions and physical residuals, while the generic offset solver owns linearization and iteration and expansion owns strict fallback and final assertion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid targets or budgets throw; unreadable trials and unusable intervals return null without widening support or changing the original shape.
 * @evidence contracts/common.md#meaningful-documentation The comment defines null, dimensionless residuals, absolute budget ownership, common candidate geometry, fallback and read-only inputs; successful output is the solved shape.
 * @evidence contracts/performance.md#efficient-algorithms For U unknowns each trial applies up to U directions, evaluates one body and reads U rows; bounded offset iterations dominate, with Jacobian O(U squared) storage in addition to reader geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Each trial shares its reader across rows and its initial residual is passed directly to the solver; changed scalar offsets require fresh candidate evaluation rather than a cross-trial cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trial shapes, readers and solver matrices are owned by this synchronous invocation and released on return or refusal; only a successful record transfers to the caller, with no handles or tasks.
 */
export function solveHumanBodySimpleCoupling(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  unknowns: IHumanBodySimpleUnknown[],
): Record<string, number> | null {
  if (unknowns.length === 0) return { ...shape };
  if (
    unknowns.some(
      (unknown: IHumanBodySimpleUnknown): boolean =>
        !Number.isFinite(unknown.target) ||
        unknown.target <= 0 ||
        !Number.isFinite(unknown.tolerance) ||
        unknown.tolerance < 0,
    )
  )
    throw new Error(
      "A coupled body solve needs positive finite targets and nonnegative finite tolerances.",
    );
  const wear: (t: readonly number[]) => Record<string, number> = (
    t: readonly number[],
  ): Record<string, number> => {
    let trial: Record<string, number> = shape;
    unknowns.forEach((unknown: IHumanBodySimpleUnknown, j: number): void => {
      if (t[j] !== 0)
        trial = direction.worn(basis, trial, unknown.along.direction, t[j]);
    });
    return trial;
  };
  const evaluate: (t: readonly number[]) => number[] | null = (
    t: readonly number[],
  ): number[] | null => {
    const trial: Record<string, number> = wear(t);
    const reader: ReturnType<typeof createHumanBodyMeasurementReader> =
      createHumanBodyMeasurementReader(basis, trial);
    const residual: number[] = [];
    for (const unknown of unknowns) {
      const value: number | null = unknown.read(reader, trial);
      if (value === null || !Number.isFinite(value)) return null;
      residual.push((value - unknown.target) / unknown.target);
    }
    return residual;
  };
  const initial: number[] | null = evaluate(unknowns.map((): number => 0));
  if (initial === null) return null;
  if (humanBodySimpleResidualsMet(initial, unknowns)) return { ...shape };
  const ranges: [number, number][] = [];
  for (const unknown of unknowns) {
    const range: [number, number] | null = humanBodySimpleCouplingRange(
      basis.channels,
      shape,
      unknown.along.direction,
    );
    if (range === null) return null;
    ranges.push(range);
  }
  const solved: ReturnType<typeof solveHumanBodySimpleOffsets> =
    solveHumanBodySimpleOffsets({
      ranges,
      initial,
      evaluate,
      met: (residual: readonly number[]): boolean =>
        humanBodySimpleResidualsMet(residual, unknowns),
    });
  return solved === null ? null : wear(solved);
}
