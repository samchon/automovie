import { AutoMovieArchetypeRefusal } from "../core";

/**
 * Admit one phase-cell advance before the ride enumerates stride boundaries.
 *
 * The planner evaluates one gait clock per cell and permits at most one stride
 * decision there. This is an explicit capacity policy, not a biological minimum
 * period or a claim that constant clocks cannot be interpolated more sparsely.
 * Its cell width supplies the minimum supported period for that plan.
 *
 * For S cells, retained phase rows are at most S+1 and current/lookahead stride
 * records at most S+2. Four limbs publish at most 4(S+1) landings and at most S
 * gait/lead changes: 5S+4 animal events, plus the course's own C input events.
 * Neither the analysis nor the fluid solver's unrelated budgets apply here.
 *
 * @param archetype The producer named by a structured refusal.
 * @param phase Previously admitted cumulative cycles, initially zero.
 * @param seconds Positive finite width of this plan's phase cell, seconds.
 * @param stride Positive finite effective period at the cell, seconds.
 * @param cells Positive safe-integer count of cells in the phase plan.
 * @returns The strictly advancing, finite cumulative phase within capacity.
 * @throws {AutoMovieArchetypeRefusal} Before enumeration for nonrepresentable
 *   arithmetic or a plan requiring more than one complete cycle per cell.
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
      cells > 0 &&
      phase >= 0 &&
      seconds > 0 &&
      stride > 0 &&
      advance > 0 &&
      advance <= 1 &&
      next > phase &&
      next <= cells &&
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
        minimum: seconds > 0 ? seconds : null,
        maximum: null,
        unit: "s",
      },
      reason: `the ${cells}-cell phase plan permits one stride decision per cell; advance ${advance} and next phase ${next} must be finite, representable and within that capacity`,
      fix: "Shorten the course or supply a declared stride no shorter than its phase-cell width.",
    });
  return next;
}
