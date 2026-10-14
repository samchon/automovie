import {
  type IAutoMovieQuadraticRow,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";
import type { IAutoMovieQuadraticRefinementResult as IAutoMovieQuadraticRefinementResultImported } from "@automovie/engine/math/IAutoMovieQuadraticRefinementResult";
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
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation A nonnegative elastic column restores minimax affine contact excess within unchanged hard-domain rows, then a second QP minimizes gain departure at the attained excess. Graph-only input retains spacing strategy; native residual refinement does not replace the caller's nonlinear physical admission.
 * @evidence contracts/common.md#clear-and-simple-design One two-phase step owns affine restoration/departure; engine owners solve/refine, and the closure owner rebuilds and judges actual geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical bounds are not widened. Existing 1e-10 normalized residual/eight-refinement and graph-only half-spacing policies remain explicit; non-success/nonfinite/residual failure refuses with receipts instead of retrying an altered domain.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes this minimax objective from SNOPT, candidate slacks from geometry, graph-only behavior and earlier-phase receipts from final acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Construction/evaluation follow row nonzeros; two native QPs and bounded residual refinements dominate by dimension, sparsity and native iterations. Total solve cost is not claimed linear.
 * @evidence contracts/performance.md#reuse-equivalent-work Original rows and restoration primal feed departure and failure receipts; different nonlinear linearizations require a new step rather than cached acceptance.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rows/objectives/two receipts are local; only field/slacks transfer. Failure JSON can scale with full input/receipts, and this owner retains no native handle or history.
 */
export function solveHumanFaceNativeClosureStep(
  input: IHumanFaceNativeClosureStepInput,
): IHumanFaceNativeClosureStep {
  const {
    rows,
    variables,
    contactStart,
    contactEnd,
  }: IHumanFaceNativeClosureStepInput = input;
  if (
    !Number.isInteger(variables) ||
    variables < 1 ||
    !Number.isInteger(contactStart) ||
    !Number.isInteger(contactEnd) ||
    contactStart < 0 ||
    contactEnd < contactStart ||
    contactEnd > rows.length
  )
    throw new Error(
      "Native closure step needs its original variable and nonlinear-row partition.",
    );
  const hasContact: boolean = contactEnd > contactStart;
  const elasticColumn: number = variables + 1;
  const dimension: number = variables + (hasContact ? 2 : 1);
  const problem: IAutoMovieQuadraticRow[] = [];
  rows.forEach((row: IAutoMovieQuadraticRow, at: number): void => {
    if (!hasContact || at < contactStart || at >= contactEnd) {
      problem.push(row);
      return;
    }
    if (row.lower !== null)
      problem.push({
        indices: [...row.indices, elasticColumn],
        weights: [...row.weights, 1],
        lower: row.lower,
        upper: null,
      });
    if (row.upper !== null)
      problem.push({
        indices: [...row.indices, elasticColumn],
        weights: [...row.weights, -1],
        lower: null,
        upper: row.upper,
      });
  });
  if (hasContact)
    problem.push({
      indices: [elasticColumn],
      weights: [1],
      lower: 0,
      upper: null,
    });
  const objective: number[] = new Array<number>(dimension).fill(0);
  objective[hasContact ? elasticColumn : variables] = hasContact ? 1 : -1;
  const precision: number = 1e-10;
  const restorationProblem: {
    diagonal: number[];
    linear: number[];
    rows: IAutoMovieQuadraticRow[];
  } = {
    diagonal: new Array<number>(dimension).fill(0),
    linear: objective,
    rows: problem,
  };
  const restoration: IAutoMovieQuadraticRefinementResultImported =
    refineAutoMovieQuadraticProgram(
      restorationProblem,
      solveAutoMovieQuadraticProgram(restorationProblem),
      { tolerance: precision, maximumRefinements: 8 },
    );
  if (
    restoration.status !== 1 ||
    !restoration.primal.every(Number.isFinite) ||
    !(
      restoration.maximumViolation <= precision &&
      restoration.stationarityResidual <= precision &&
      restoration.complementarityResidual <= precision
    )
  )
    throw new Error(
      "Native closure restoration failed: " +
        JSON.stringify({
          status: restoration.status,
          maximumViolation: restoration.maximumViolation,
          input,
          solverInput: restorationProblem,
          restoration,
        }),
    );
  // Status 1 and a reported slack do not establish epigraph feasibility.
  // Re-read the original affine contact rows at the returned field. This
  // attained excess is a realizable epigraph upper for that field, even if
  // the native elastic variable is slightly negative or understates a row.
  // No physical tolerance is added: the original endpoints define the excess.
  const optimum: number = hasContact
    ? rows
        .slice(contactStart, contactEnd)
        .reduce((maximum: number, row: IAutoMovieQuadraticRow): number => {
          const value: number = row.indices.reduce(
            (sum: number, column: number, at: number): number =>
              sum + row.weights[at] * restoration.primal[column],
            0,
          );
          return Math.max(
            maximum,
            row.lower === null ? 0 : row.lower - value,
            row.upper === null ? 0 : value - row.upper,
          );
        }, 0)
    : restoration.primal[variables];
  problem.push(
    hasContact
      ? { indices: [elasticColumn], weights: [1], lower: 0, upper: optimum }
      : {
          indices: [variables],
          weights: [1],
          lower: optimum > 0 ? optimum / 2 : 0,
          upper: null,
        },
  );
  const departureProblem: {
    diagonal: (0 | 1)[];
    linear: number[];
    rows: IAutoMovieQuadraticRow[];
  } = {
    diagonal: Array.from(
      { length: dimension },
      (_: unknown, at: number): 0 | 1 => (at < variables ? 1 : 0),
    ),
    linear: new Array<number>(dimension).fill(0),
    rows: problem,
  };
  const result: IAutoMovieQuadraticRefinementResultImported =
    refineAutoMovieQuadraticProgram(
      departureProblem,
      solveAutoMovieQuadraticProgram(departureProblem),
      { tolerance: precision, maximumRefinements: 8 },
    );
  if (
    result.status !== 1 ||
    !result.primal.every(Number.isFinite) ||
    !(
      result.maximumViolation <= precision &&
      result.stationarityResidual <= precision &&
      result.complementarityResidual <= precision
    )
  )
    throw new Error(
      "Native closure minimum-departure solve failed: " +
        JSON.stringify({
          status: result.status,
          maximumViolation: result.maximumViolation,
          input,
          solverInput: departureProblem,
          restoration,
          result,
        }),
    );
  return {
    field: result.primal.slice(0, variables),
    apertureSlack: hasContact ? result.primal[elasticColumn] : 0,
    spacingSlack: result.primal[variables],
  };
}
