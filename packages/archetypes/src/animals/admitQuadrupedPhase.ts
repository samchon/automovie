import { AutoMovieArchetypeRefusal } from "../core";

/**
 * Admit one phase-cell advance before the ride enumerates stride boundaries.
 *
 * The planner evaluates one gait clock per cell and permits at most one stride
 * decision there. This is an explicit capacity policy, not a biological minimum
 * period or a claim that constant clocks cannot be interpolated more sparsely.
 * Its actual cell width supplies the minimum supported period for that plan.
 *
 * For S cells, retained phase rows are at most S+1 and current/lookahead stride
 * records at most S+2. Four limbs publish at most 4(S+1) landings and at most S
 * gait/lead changes: 5S+4 animal events, plus the course's own C input events.
 * Neither the analysis nor the fluid solver's unrelated budgets apply here.
 *
 * @param archetype The actual producer named by a structured refusal.
 * @param phase Previously admitted cumulative cycles, initially zero.
 * @param seconds Positive finite width of this plan's phase cell, seconds.
 * @param stride Positive finite effective period at the cell, seconds.
 * @param cells Positive safe-integer count of cells in the actual phase plan.
 * @returns The strictly advancing, finite cumulative phase within capacity.
 * @throws {AutoMovieArchetypeRefusal} Before enumeration for nonrepresentable arithmetic or a plan requiring more than one complete cycle per cell.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States SI units, representability, the explicit one-decision-per-cell capacity policy and exact retained-record/event bounds without presenting capacity as physiology or mathematical interpolation necessity.
 * @evidence contracts/development/implementation.md#principled-implementation Divides the actual cell width by its effective period, then admits finite positive advance≤1, finite strictly increasing cumulative phase≤S and safe integer boundary indices/count≤1 before any stride allocation loop can use them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Calculate the candidate and its integer crossings once, apply one complete admission predicate and return it or a structured refusal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No biological minimum, ULP adjustment, scene exception or borrowed unrelated budget hides an unsupported clock; the caller must shorten the plan or supply a slower declared period.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic and admission before any crossed-stride enumeration, including division overflow, unchanging rounded phases and finite billion-event requests.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns the validated next phase so the enumerator does not repeat arithmetic or substitute a different candidate.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state and allocates no phase or event array; the caller owns the explicitly bounded plan records.
 */
export function admitQuadrupedPhase(
  archetype: string,
  phase: number,
  seconds: number,
  stride: number,
  cells: number,
): number {
  const advance: number = seconds / stride;
  const next: number = phase + advance;
  const from: number = Math.floor(phase);
  const to: number = Math.floor(next);
  const crossed: number = to - from;
  if (
    !(
      Number.isSafeInteger(cells) &&
      cells > 0 &&
      Number.isFinite(phase) &&
      phase >= 0 &&
      Number.isFinite(seconds) &&
      seconds > 0 &&
      Number.isFinite(stride) &&
      stride > 0 &&
      Number.isFinite(advance) &&
      advance > 0 &&
      advance <= 1 &&
      Number.isFinite(next) &&
      next > phase &&
      next <= cells &&
      Number.isSafeInteger(from) &&
      Number.isSafeInteger(to) &&
      Number.isSafeInteger(crossed) &&
      crossed >= 0 &&
      crossed <= 1
    )
  )
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "gait.phasePlan",
      value: { phase, seconds, stride, cells, advance, next, crossed },
      feasible: {
        kind: "range",
        minimum: Number.isFinite(seconds) && seconds > 0 ? seconds : null,
        maximum: null,
        unit: "s",
      },
      reason: `the ${cells}-cell phase plan permits one stride decision per cell; advance ${advance} and next phase ${next} must be finite, representable and within that capacity`,
      fix: "Shorten the course or supply a declared stride no shorter than its phase-cell width.",
    });
  return next;
}
