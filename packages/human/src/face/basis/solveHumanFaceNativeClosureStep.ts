import { solveAutoMovieQuadraticProgram, type IAutoMovieQuadraticRow } from "@automovie/engine";
import { refineAutoMovieQuadraticProgram } from "@automovie/engine/math/refineAutoMovieQuadraticProgram";
import type { IHumanFaceNativeClosureStep } from "./IHumanFaceNativeClosureStep";
import type { IHumanFaceNativeClosureStepInput } from "./IHumanFaceNativeClosureStepInput";

/**
 * Restore a nonlinear aperture linearization inside the original hard domain.
 * A common nonnegative elastic variable minimizes the worst affine contact
 * excess, matching the field owner's maximum actual-aperture merit. Original
 * gain, central-seat and graph rows remain unchanged. A second QP minimizes
 * gain departure at the attained minimax aperture value; it admits no added
 * physical clearance. With no contact rows, the graph-only phase retains its
 * original maximum-spacing/interior-minimum-gain strategy.
 * Shared residual refinement seeks 1e-10 in these original normalized units.
 * Its finite work budget and native statuses never replace physical admission.
 * A minimum-departure refusal records the already-computed restoration result
 * beside its failed result; successful earlier-phase KKT is no final geometry witness.
 *
 * The Stanford SOL SNOPT treatment distinguishes infeasible nonlinear
 * linearizations from an infeasible original problem and restores nonlinear
 * rows elastically while preserving the linear domain:
 * https://web.stanford.edu/group/SOL/software/snoptHelp/Description_of_method/Treatment_of_constraint_infeasibilities.htm
 * This owner uses an L-infinity residual rather than SNOPT's L1 objective and
 * does not implement SNOPT. Returned slacks are internal candidates; the caller
 * alone admits the actual geometry at its unchanged original tolerance.
 *
 * @evidence contracts/common.md#principled-implementation A single common elastic variable bounds both signed contact interval violations; lexicographic minimax residual then squared gain departure preserves every hard row and original nonlinear acceptance remains downstream.
 * @evidence contracts/common.md#clear-and-simple-design One shared QP adapter owns contact-row elasticity and the two-stage objective; the field owner owns nonlinear measurements and step selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The method is selected by the declared nonlinear row partition, not by an infeasible-status exception; original hard endpoints are never relaxed.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes internal slack, minimax preference, reference method and actual-output acceptance.
 * @evidence contracts/modeling.md#spatial-conventions Original normalized field and aperture units pass through unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The caller owns the closure channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The field owner validates original contact courses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly observes the field.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no tissue mechanics or clinical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The field owner retains original physical limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no public authoring input.
 * @author Samchon
 */
export function solveHumanFaceNativeClosureStep(input: IHumanFaceNativeClosureStepInput): IHumanFaceNativeClosureStep {
  const { rows, variables, contactStart, contactEnd } = input;
  if (!Number.isInteger(variables) || variables < 1 || !Number.isInteger(contactStart) ||
      !Number.isInteger(contactEnd) || contactStart < 0 || contactEnd < contactStart || contactEnd > rows.length)
    throw new Error("Native closure step needs its original variable and nonlinear-row partition.");
  const hasContact = contactEnd > contactStart;
  const elasticColumn = variables + 1;
  const dimension = variables + (hasContact ? 2 : 1);
  const problem: IAutoMovieQuadraticRow[] = [];
  rows.forEach((row, at) => {
    if (!hasContact || at < contactStart || at >= contactEnd) { problem.push(row); return; }
    if (row.lower !== null) problem.push({ indices: [...row.indices, elasticColumn],
      weights: [...row.weights, 1], lower: row.lower, upper: null });
    if (row.upper !== null) problem.push({ indices: [...row.indices, elasticColumn],
      weights: [...row.weights, -1], lower: null, upper: row.upper });
  });
  if (hasContact) problem.push({ indices: [elasticColumn], weights: [1], lower: 0, upper: null });
  const objective = new Array<number>(dimension).fill(0);
  objective[hasContact ? elasticColumn : variables] = hasContact ? 1 : -1;
  const precision = 1e-10;
  const restorationProblem = { diagonal: new Array<number>(dimension).fill(0), linear: objective, rows: problem };
  const restoration = refineAutoMovieQuadraticProgram(restorationProblem,
    solveAutoMovieQuadraticProgram(restorationProblem), { tolerance: precision, maximumRefinements: 8 });
  if (restoration.status !== 1 || !restoration.primal.every(Number.isFinite) ||
      !(restoration.maximumViolation <= precision && restoration.stationarityResidual <= precision &&
        restoration.complementarityResidual <= precision))
    throw new Error("Native closure restoration failed: " + JSON.stringify({ status: restoration.status,
      maximumViolation: restoration.maximumViolation, input, solverInput: restorationProblem, restoration }));
  // Status 1 and a reported slack do not establish epigraph feasibility.
  // Re-read the original affine contact rows at the returned field. This
  // attained excess is a realizable epigraph upper for that field, even if
  // the native elastic variable is slightly negative or understates a row.
  // No physical tolerance is added: the original endpoints define the excess.
  const optimum = hasContact ? rows.slice(contactStart, contactEnd).reduce((maximum, row) => {
    const value = row.indices.reduce((sum, column, at) => sum + row.weights[at] * restoration.primal[column], 0);
    return Math.max(maximum, row.lower === null ? 0 : row.lower - value,
      row.upper === null ? 0 : value - row.upper);
  }, 0) : restoration.primal[variables];
  problem.push(hasContact
    ? { indices: [elasticColumn], weights: [1], lower: 0, upper: optimum }
    : { indices: [variables], weights: [1], lower: optimum > 0 ? optimum / 2 : 0, upper: null });
  const departureProblem = { diagonal: Array.from({ length: dimension }, (_, at) => at < variables ? 1 : 0),
    linear: new Array<number>(dimension).fill(0), rows: problem };
  const result = refineAutoMovieQuadraticProgram(departureProblem,
    solveAutoMovieQuadraticProgram(departureProblem), { tolerance: precision, maximumRefinements: 8 });
  if (result.status !== 1 || !result.primal.every(Number.isFinite) ||
      !(result.maximumViolation <= precision && result.stationarityResidual <= precision &&
        result.complementarityResidual <= precision))
    throw new Error("Native closure minimum-departure solve failed: " + JSON.stringify({ status: result.status,
      maximumViolation: result.maximumViolation, input, solverInput: departureProblem,
      restoration, result }));
  return { field: result.primal.slice(0, variables),
    apertureSlack: hasContact ? result.primal[elasticColumn] : 0, spacingSlack: result.primal[variables] };
}
