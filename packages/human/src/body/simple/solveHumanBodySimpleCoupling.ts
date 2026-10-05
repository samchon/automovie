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
 * @evidence contracts/common.md#principled-implementation Each trial is shaped once and every named measurement reads that same skin; normalization by its admitted positive target makes the numerical residual dimensionless, while termination restores each row's absolute physical budget. Offset intervals are derived from existing channel envelopes, and unresolved numerical systems return null to the strict measured-reach inverse.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns one body's shared readings and shape reconstruction; the offset range, precision predicate and numerical iteration have separate single owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Targets are never fitted to a person or photograph; input shape and request rows are unchanged, and a null or nonfinite instrument cannot fabricate a solution.
 * @evidence contracts/common.md#meaningful-documentation States the shared-body reading order, target units, ownership, initial-met path, unresolved systems and the final assertion required after stature reconciliation.
 * @evidence contracts/modeling.md#spatial-conventions Measurements use their declared metres or kilograms on the rest skin; dividing by the same-unit positive target produces dimensionless residuals, and reconstruction uses dimensionless basis offsets.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This adapter owns no part or group.
 * @evidence contracts/modeling.md#parameter-channels Trial reconstruction consumes the actual named basis channels. An omitted weight is basis-neutral zero; offset zero instead keeps the supplied current shape. A positive offset adds each direction's signed coefficient to its channel, so a negative coefficient reverses the channel's positive direction. Existing envelopes bound these weights, and explicit left/right identities remain distinct without an inferred mirror update. Multiple physical readings can depend on the same channel; the simultaneous Jacobian reads those dependencies on one shared skin and may remain unresolved for overlapping or singular directions. These rules do not establish independent biological traits or physiological validity of the authored basis.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits a shape record, not geometry; the measurement reader owns rest evaluation.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; expansion and the body builder own the form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It defines no anatomical value; the measurement rules and expansion own the physical definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range It establishes numerical target/tolerance premises over existing measured channel reach, not a new physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Request rows are internal compiler state derived from named simple measurements, not authored document controls.
 */
export function solveHumanBodySimpleCoupling(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  unknowns: IHumanBodySimpleUnknown[],
): Record<string, number> | null {
  if (unknowns.length === 0) return { ...shape };
  if (unknowns.some((unknown) => !Number.isFinite(unknown.target) ||
    unknown.target <= 0 || !Number.isFinite(unknown.tolerance) || unknown.tolerance < 0))
    throw new Error("A coupled body solve needs positive finite targets and nonnegative finite tolerances.");
  const wear = (t: readonly number[]): Record<string, number> => {
    let trial = shape;
    unknowns.forEach((unknown, j) => {
      if (t[j] !== 0) trial = direction.worn(basis, trial, unknown.along.direction, t[j]);
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
    const range = humanBodySimpleCouplingRange(basis.channels, shape, unknown.along.direction);
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
