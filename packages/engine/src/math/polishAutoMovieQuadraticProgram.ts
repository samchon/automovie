import { adjacentAutoMovieFloat64 } from "./adjacentAutoMovieFloat64";
import { solveAutoMovieQuadraticWorkingSetStep } from "./solveAutoMovieQuadraticWorkingSetStep";
import type { IAutoMovieQuadraticPolishingResult } from "./IAutoMovieQuadraticPolishingResult";
import type { IAutoMovieQuadraticRefinementInterval as Group } from "./IAutoMovieQuadraticRefinementInterval";
import type { IAutoMovieQuadraticRefinementOptions } from "./IAutoMovieQuadraticRefinementOptions";
import type { solveAutoMovieQuadraticProgram } from "./solveAutoMovieQuadraticProgram";

type Problem = Parameters<typeof solveAutoMovieQuadraticProgram>[0];
type Native = ReturnType<typeof solveAutoMovieQuadraticProgram>;

/**
 * Prepare a correction near an unchanged native primal and signed dual.
 * When the independent original-row owner has already admitted feasibility and
 * complementarity, retain that primal and cyclically minimize stationarity's
 * squared Euclidean norm over each signed-dual coordinate. Its box comes from
 * the same original equality, null-bound and complementarity predicate; native
 * multipliers need no initial global clipping. Original full-row KKT alone
 * admits the result, and Euclidean decrease guarantees no infinity-norm success
 * or convergence within the caller's finite work budget.
 *
 * Wright (2015), sections 1.1-1.2, treats box constraints by coordinate
 * indicators and exact scalar minimization:
 * https://arxiv.org/pdf/1502.04759
 * A different native residual signature instead selects joint correction.
 * Neither problem phase names nor particular original rows select the method.
 * Each started dual sweep or working solve consumes that one unchanged budget.
 *
 * The refinement owner supplies exact coefficient groups and their interval
 * intersections. Only identical sparse A rows share an equation: proportional,
 * differently signed or differently scaled rows remain separate. Their active
 * endpoint is the strongest original lower/upper owner, so nested copies cannot
 * demand incompatible endpoint equations for the same affine value.
 *
 * The sum of original signed multipliers is the group multiplier because the
 * coefficients are identical. Corrections preserve that equation and restore
 * its signed multiplier to the original endpoint owner. A point intersection
 * allows a free multiplier: its sign chooses the lower or upper owner, including
 * point intersections formed by separate one-sided inequalities. Every original
 * row stays in independent final admission; grouping is no deleted QP constraint.
 *
 * Joint correction uses a changing independent working basis. Its native start
 * must be feasible on every original row within the unchanged caller threshold;
 * initial inequalities must also be practically active at that threshold. This
 * is an explicit finite-arithmetic premise, not an exact feasible-point theorem.
 * Wrong-sign working multipliers leave the basis; every original row can block
 * a primal step and supply its exact endpoint owner. Structural zero equalities
 * compress exactly; other unresolved dependence refuses without row deletion.
 * QR solves the unchanged PSD objective on the working null space. Flat descent
 * needs a finite original-row blocker; rank uncertainty preserves native state.
 * Each attempted working solve shares the same finite budget as dual sweeps.
 * Gill and Wong (2014), sections 2-3, describe independent working bases,
 * sign-aware changes and blocking constraints:
 * https://www.ccom.ucsd.edu/~peg/papers/genqp.pdf
 * No shifted/penalized feasibility phase, extra native solve or convergence
 * guarantee is supplied here. A trial is adopted only after original full KKT.
 * Before a flat step, a separate working-normal dual estimate is paired with
 * its own affine origin and measured by that same original full-row owner.
 * Nonzero projected scalars introduce no new stopping epsilon. A failed normal
 * candidate neither replaces the live flat state nor supplies optimum sign
 * departures; finite objective and native status remain with the final refiner.
 *
 * @param groups Refiner-owned exact coefficient groups with original endpoint
 * owners and complete original ordinals; inputs have passed its intersection check.
 * @param readMerit Original full-row KKT maximum, owned by the refinement caller.
 * @param readGradient Original stationarity measurement, owned by that caller.
 * @param readComplementarity Original signed/null/equality predicate, owned by that caller.
 * @param fixedPrimalEligible Original native feasibility and complementarity already pass.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Preserves the original constrained objective and every interval while preparing a primal/dual correction near the retained native result.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Uses exact intersection endpoint authority, restores aggregate multipliers to original rows and admits no candidate independently of the complete original-row owner.
 */
export function polishAutoMovieQuadraticProgram(
  input: Problem,
  native: Native,
  options: IAutoMovieQuadraticRefinementOptions,
  groups: readonly Group[],
  readMerit: (primal: readonly number[], dual: readonly number[]) => number,
  readGradient: (primal: readonly number[], dual: readonly number[]) => number[],
  readComplementarity: (row: number, value: number, multiplier: number) => number,
  fixedPrimalEligible: boolean,
): IAutoMovieQuadraticPolishingResult {
  let primal = native.primal.slice(), dual = native.dual.slice();
  const activeRows: number[][] = [], regularizations: number[] = [];
  const stepSizes: number[] = [], merits: number[] = [];
  const dualUpdates: number[] = [];
  const linearResiduals: number[] = [], jointMerits: number[] = [];
  const workingRanks: number[] = [], workingChanges: string[] = [];
  let trialPrimal: number[] = [], trialDual: number[] = [], trialStarted = false;
  const method = fixedPrimalEligible ? "fixed-primal-dual" : "interval-joint";
  let reason = "The original native solve is not Solved.";
  let iterations = 0, dualPasses = 0;
  const dampingEvaluations = 0;
  const result = (): IAutoMovieQuadraticPolishingResult => ({
    accepted: false, primal, dual, iterations, activeRows, regularizations,
    stepSizes, merits, dampingEvaluations, method, dualPasses, dualUpdates,
    linearResiduals, jointMerits, workingRanks, workingChanges,
    trialPrimal: trialStarted ? trialPrimal.slice() : undefined,
    trialDual: trialStarted ? trialDual.slice() : undefined, reason,
  });
  if (native.status !== 1) return result();
  if (options.maximumRefinements === 0) {
    reason = "The caller supplied no polishing work budget.";
    return result();
  }
  let merit = readMerit(primal, dual);
  if (!Number.isFinite(merit) || merit < 0) {
    reason = "The original full-row KKT merit is not representable.";
    return result();
  }
  merits.push(merit);
  if (fixedPrimalEligible) {
    // Already admitted primal/complementarity need no global dual clipping.
    // Each scalar minimizer stays in that original row's complementarity box.
    reason = "The caller's original dual correction work budget was exhausted.";
    while (iterations < options.maximumRefinements) {
      iterations++; dualPasses++; dualUpdates.push(0);
      const gradient = readGradient(primal, dual);
      if (!gradient.every(Number.isFinite)) {
        reason = "The original fixed-primal stationarity is not representable.";
        return result();
      }
      for (let at = 0; at < input.rows.length; at++) {
        const row = input.rows[at];
        let value = 0, maximum = 0;
        for (let corner = 0; corner < row.indices.length; corner++) {
          const coefficient = row.weights[corner];
          value += coefficient * primal[row.indices[corner]];
          maximum = Math.max(maximum, Math.abs(coefficient));
        }
        if (!Number.isFinite(value)) {
          reason = "The original fixed-primal affine value is not representable.";
          return result();
        }
        if (maximum === 0) continue;
        let squared = 0, projection = 0;
        for (let corner = 0; corner < row.indices.length; corner++) {
          const normalized = row.weights[corner] / maximum;
          squared += normalized * normalized;
          projection += normalized * gradient[row.indices[corner]];
        }
        const correction = -(projection / squared) / maximum;
        if (!Number.isFinite(correction)) {
          reason = "The fixed-primal scalar correction is not representable.";
          return result();
        }
        const limit = (bound: number | null): number => bound === null
          ? options.tolerance : value === bound ? Infinity
            : options.tolerance / Math.abs(value - bound);
        const equality = row.lower !== null && row.lower === row.upper;
        const lower = equality ? -Infinity : -limit(row.lower);
        const upper = equality ? Infinity : limit(row.upper);
        let candidate = Math.max(lower, Math.min(upper, dual[at] + correction));
        if (!Number.isFinite(candidate)) {
          reason = "The original signed-dual scalar candidate is not representable.";
          return result();
        }
        if (!(readComplementarity(at, value, candidate) <= options.tolerance)) {
          if (candidate === 0) {
            reason = "The original complementarity predicate rejects zero dual.";
            return result();
          }
          // An upward-rounded quotient can cross the original product bound.
          // One adjacent finite Float64 toward zero is independently checked.
          candidate = adjacentAutoMovieFloat64(candidate, candidate < 0);
          if (!(readComplementarity(at, value, candidate) <= options.tolerance)) {
            reason = "The rounded original complementarity interval is not representable.";
            return result();
          }
        }
        const change = candidate - dual[at];
        if (change === 0) continue;
        dual[at] = candidate; dualUpdates[dualUpdates.length - 1]++;
        // The sparse difference updates the algorithm's working gradient;
        // the refinement owner remeasures the full original formula each pass.
        for (let corner = 0; corner < row.indices.length; corner++)
          gradient[row.indices[corner]] += row.weights[corner] * change;
      }
      merit = readMerit(primal, dual);
      merits.push(merit);
      if (!Number.isFinite(merit) || merit < 0) {
        reason = "The original fixed-primal KKT merit is not representable.";
        return result();
      }
      if (merit <= options.tolerance) {
        reason = "The original fixed-primal full-row KKT reached the caller's threshold.";
        return result();
      }
      if (dualUpdates[dualUpdates.length - 1] === 0) {
        reason = "No represented original signed-dual coordinate changed.";
        return result();
      }
    }
    return result();
  }
  const valueOf = (row: Problem["rows"][number], values: readonly number[]): number => {
    let value = 0;
    for (let at = 0; at < row.indices.length; at++) value += row.weights[at] * values[row.indices[at]];
    return value;
  };
  const feasible = (values: readonly number[]): boolean => input.rows.every((row) => {
    const value = valueOf(row, values);
    return Number.isFinite(value) &&
      (row.lower === null || row.lower - value <= options.tolerance) &&
      (row.upper === null || value - row.upper <= options.tolerance);
  });
  if (!feasible(native.primal)) {
    reason = "working-set-native-start-not-practically-feasible";
    return result();
  }
  const selected: Group[] = [], bounds: number[] = [], owners: number[] = [];
  const free: boolean[] = [];
  let objectiveScale = 1;
  for (const value of input.diagonal) objectiveScale = Math.max(objectiveScale, value);
  for (const group of groups) {
    const value = valueOf(group, native.primal);
    let squared = 0;
    for (const coefficient of group.weights) squared += coefficient * coefficient;
    const multiplier = group.originals.reduce((sum, at) => sum + native.dual[at], 0);
    const shift = multiplier * squared / objectiveScale;
    if (!Number.isFinite(value) || !Number.isFinite(shift)) {
      reason = "working-set-native-activity-not-representable";
      return result();
    }
    const point = group.lower !== null && group.lower === group.upper;
    const lower = group.lower !== null && (point || shift < group.lower - value) &&
      Math.abs(value - group.lower) <= options.tolerance;
    const upper = group.upper !== null && shift > group.upper - value &&
      Math.abs(value - group.upper) <= options.tolerance;
    if (point || lower || upper) {
      const bound = lower || point ? group.lower : group.upper;
      if (bound === null) {
        reason = "working-set-selected-endpoint-is-unbounded"; return result();
      }
      selected.push(group); bounds.push(bound);
      owners.push(lower || point ? group.lowerOwner : group.upperOwner); free.push(point);
    }
  }
  const restoreDual = (multipliers: readonly number[]): number[] => {
    const restored = new Array<number>(input.rows.length).fill(0);
    for (let at = 0; at < selected.length; at++) {
      const group: Group = selected[at];
      const multiplier: number = multipliers[at];
      const owner = free[at] ? multiplier >= 0 ? group.upperOwner : group.lowerOwner : owners[at];
      restored[owner] += multiplier;
    }
    return restored;
  };
  trialPrimal = native.primal.slice(); trialDual = native.dual.slice(); trialStarted = true;
  reason = "The original working-set correction budget was exhausted.";
  while (iterations < options.maximumRefinements) {
    activeRows.push(owners.slice()); regularizations.push(0); iterations++;
    const solved = solveAutoMovieQuadraticWorkingSetStep(
      input.diagonal, input.linear, owners.map((at) => input.rows[at]), bounds, free, trialPrimal,
    );
    workingRanks.push(solved.basis.rank);
    if (solved.refusal !== null) { reason = solved.refusal; return result(); }
    const normalOrigin: readonly number[] | null = solved.origin;
    const normalMultipliers: readonly number[] | null = solved.normalDual;
    if (solved.flatDirection !== null && normalOrigin !== null && normalMultipliers !== null) {
      const normalDual: number[] = restoreDual(normalMultipliers);
      const normalMerit: number = readMerit(normalOrigin, normalDual);
      if (Number.isFinite(normalMerit) && normalMerit >= 0) {
        jointMerits.push(normalMerit);
        if (normalMerit <= options.tolerance) {
          primal = normalOrigin.slice(); dual = normalDual.slice(); merits.push(normalMerit);
          trialPrimal = primal.slice(); trialDual = dual.slice();
          reason = "The original full-row normal candidate reached the caller's threshold.";
          return result();
        }
      }
    }
    if (solved.primal === null && solved.flatDirection === null) {
      reason = "working-set-no-primal-or-flat-direction"; return result();
    }
    const preceding: readonly number[] = trialPrimal;
    const target = solved.primal;
    const flat = solved.flatDirection;
    let direction: number[];
    if (target !== null) direction = target.map((value, at) => value - preceding[at]);
    else if (flat !== null) direction = flat.slice();
    else { reason = "working-set-no-direction"; return result(); }
    if (!direction.every(Number.isFinite)) {
      reason = "working-set-direction-not-representable"; return result();
    }
    let step = flat === null ? 1 : Infinity;
    let blocking: Group | null = null, endpoint = 0, blockingOwner = -1;
    // Working endpoints are enforced by the affine solve; every other endpoint
    // blocks. Every original row independently measures feasibility afterward.
    for (const group of groups) {
      if (group.lower !== null && group.lower === group.upper) continue;
      const value = valueOf(group, preceding), travel = valueOf(group, direction);
      const bound = travel < 0 ? group.lower : travel > 0 ? group.upper : null;
      if (bound === null) continue;
      const working = selected.indexOf(group);
      if (working !== -1 && bounds[working] === bound) continue;
      const ratio = Math.max(0, (bound - value) / travel);
      // A positive infinite quotient is beyond every finite step, not a lost
      // constraint: the original complete-row feasibility is still remeasured.
      if (ratio === Infinity) continue;
      if (!Number.isFinite(ratio)) {
        reason = "working-set-blocking-ratio-not-representable"; return result();
      }
      if (ratio < step) {
        step = ratio; blocking = group; endpoint = bound;
        blockingOwner = travel < 0 ? group.lowerOwner : group.upperOwner;
      }
    }
    if (!Number.isFinite(step)) {
      reason = "working-set-flat-descent-has-no-finite-blocker"; return result();
    }
    const next: number[] = preceding.map((value, at) => value + step * direction[at]);
    if (!next.every(Number.isFinite) || !feasible(next)) {
      reason = "working-set-original-row-feasibility-refused"; return result();
    }
    trialPrimal = next;
    stepSizes.push(step);
    if (solved.dual !== null) {
      trialDual = restoreDual(solved.dual);
      const measured = readMerit(trialPrimal, trialDual);
      jointMerits.push(measured);
      if (!Number.isFinite(measured) || measured < 0) {
        reason = "working-set-original-KKT-not-representable"; return result();
      }
      const gradient = readGradient(trialPrimal, trialDual);
      let residual = 0;
      for (const value of gradient) residual = Math.max(residual, Math.abs(value));
      for (let at = 0; at < owners.length; at++)
        residual = Math.max(residual, Math.abs(valueOf(input.rows[owners[at]], trialPrimal) - bounds[at]));
      linearResiduals.push(residual);
      if (measured <= options.tolerance) {
        primal = trialPrimal.slice(); dual = trialDual.slice(); merits.push(measured);
        reason = "The original full-row working-set KKT reached the caller's threshold.";
        return result();
      }
    }
    // At the feasible working optimum, a wrong-sign multiplier releases its
    // inequality. A blocked direction instead adds its blocking endpoint first.
    if (blocking === null && solved.dual !== null) {
      let leaving = -1, wrong = options.tolerance;
      for (let at = 0; at < selected.length; at++) {
        if (free[at]) continue;
        const violation = owners[at] === selected[at].lowerOwner ? solved.dual[at] : -solved.dual[at];
        if (violation > wrong) { wrong = violation; leaving = at; }
      }
      if (leaving !== -1) {
        workingChanges.push("leave-wrong-sign:" + owners[leaving]);
        selected.splice(leaving, 1); bounds.splice(leaving, 1);
        owners.splice(leaving, 1); free.splice(leaving, 1);
        continue;
      }
    }
    if (blocking === null) {
      reason = "working-set-candidate-failed-original-KKT-without-a-blocker"; return result();
    }
    const present = selected.indexOf(blocking);
    if (present !== -1) {
      reason = "working-set-existing-endpoint-blocked-represented-progress"; return result();
    }
    selected.push(blocking); bounds.push(endpoint); owners.push(blockingOwner); free.push(false);
    workingChanges.push("enter-blocking:" + blockingOwner);
  }
  return result();
}
