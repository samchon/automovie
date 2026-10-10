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
 */
export function solveHumanBodySimpleCoupling(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  unknowns: IHumanBodySimpleUnknown[],
): Record<string, number> | null {
  if (unknowns.length === 0) return { ...shape };
  if (
    unknowns.some(
      (unknown) =>
        !Number.isFinite(unknown.target) ||
        unknown.target <= 0 ||
        !Number.isFinite(unknown.tolerance) ||
        unknown.tolerance < 0,
    )
  )
    throw new Error(
      "A coupled body solve needs positive finite targets and nonnegative finite tolerances.",
    );
  const wear = (t: readonly number[]): Record<string, number> => {
    let trial = shape;
    unknowns.forEach((unknown, j) => {
      if (t[j] !== 0)
        trial = direction.worn(basis, trial, unknown.along.direction, t[j]);
    });
    return trial;
  };
  const evaluate = (t: readonly number[]): number[] | null => {
    const trial = wear(t);
    const reader = createHumanBodyMeasurementReader(basis, trial);
    const residual: number[] = [];
    for (const unknown of unknowns) {
      const value = unknown.read(reader, trial);
      if (value === null || !Number.isFinite(value)) return null;
      residual.push((value - unknown.target) / unknown.target);
    }
    return residual;
  };
  const initial = evaluate(unknowns.map(() => 0));
  if (initial === null) return null;
  if (humanBodySimpleResidualsMet(initial, unknowns)) return { ...shape };
  const ranges: [number, number][] = [];
  for (const unknown of unknowns) {
    const range = humanBodySimpleCouplingRange(
      basis.channels,
      shape,
      unknown.along.direction,
    );
    if (range === null) return null;
    ranges.push(range);
  }
  const solved = solveHumanBodySimpleOffsets({
    ranges,
    initial,
    evaluate,
    met: (residual) => humanBodySimpleResidualsMet(residual, unknowns),
  });
  return solved === null ? null : wear(solved);
}
