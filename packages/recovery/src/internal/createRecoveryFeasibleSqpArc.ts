import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoveryFeasibleModel } from "../structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoverySqpArc } from "../structures/internal/IAutoMovieRecoverySqpArc";
import type { IAutoMovieRecoverySqpOptions } from "../structures/internal/IAutoMovieRecoverySqpOptions";
import { mixRecoveryFeasibleSqpStep } from "./mixRecoveryFeasibleSqpStep";

/**
 * Try a complete affine-QP direction and one same-base curvature correction.
 * Positive baseline weights only propose a working set. Every original affine
 * row and physical quadratic stationarity still qualify the untilted step.
 * The mixture is not the pure tilted-QP minimizer or a nonlinear certificate.
 *
 * @evidence contracts/common.md#principled-implementation Thin SVD of the independent working transpose yields equality primal/dual without normal equations. One original-physical-residual refinement reuses it before complete inactive/dual/stationarity qualification. Nominal physical-norm mixing or one original-row-supported coefficient must pass raw signs; one actual-trial correction reuses the factor with negative order-2.5 targets.
 * @evidence contracts/common.md#clear-and-simple-design This optional current-model owner supplies directions only; actual trials, every geometry gate, Armijo decrease, normal termination and rollback remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No singular floor, truncated inverse, dual clipping, row deletion, independent translation scaling, new tolerance or successful initial-state fallback supplies a result. Unsupported auxiliary work leaves the qualified baseline direction available.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes proposed working rows from nonlinear active observations, physical and metric coordinates, independent QP certificates, order-2.5 correction and absence of a finite-trial convergence guarantee.
 * @evidence contracts/performance.md#efficient-algorithms For H selected rows and q exact nonzero coordinates, thin original-design work costs O(S*(q+H)*H^2+q*H^2); complete row scans cost O(Z+n+m). Conservative reserves include transpose/SVD copies, one equality refinement, dual reconstruction, at most two mixture candidates, metric actions bounded by O(n^2), and one correction before scalable allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The same current metric and thin factor supply the equality estimate, dual and one correction. No new Jacobian, image, matching, native solver, full nullspace or Gram factor is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Before scalable numerical allocation, input plus scratch, owner resident retention and conservative visits are admitted. Fixed refusal metadata is separate from numerical slots and JS object overhead; conservative 128 base and 1024 auxiliary slots cover fixed numerical state. One model retains factors/vectors, without previous-factor or rejected-trial caches.
 */
export function createRecoveryFeasibleSqpArc(
  model: IAutoMovieRecoveryFeasibleModel,
  weights: readonly number[],
  tilted: readonly number[],
  tolerance: number,
  options: IAutoMovieRecoverySqpOptions,
  charge: (work: number) => void,
): IAutoMovieRecoverySqpArc {
  const n: number = model.width, m: number = model.rows.length;
  const result: IAutoMovieRecoverySqpArc = {
    step: null, sqpStep: null, multipliers: [], selected: [], correct: null,
    report: {
      qualified: false, reason: "unsupported", selectedRows: 0, coordinates: 0,
      designRatio: null, maximumViolation: null, equalityResidual: null,
      stationarityResidual: null, stationarityScale: null, mixWeight: null,
      equalityBeforeRefinement: null, refinementAttempted: false, nominalMixWeight: null,
      numericalMixAttempted: false, numericalMixSupported: false,
      correctionAttempted: false, correctionSupported: false, work: 0,
    },
  };
  const fail: (reason: string) => IAutoMovieRecoverySqpArc = (
    reason: string,
  ): IAutoMovieRecoverySqpArc => {
    result.report.reason = reason;
    result.step = null;
    result.correct = null;
    return result;
  };
  if (
    !Number.isSafeInteger(n) || n < 1 || n > 0x7fffffff || m < 1 ||
    model.physicalRows.length !== m || weights.length !== m || tilted.length !== n ||
    !(tolerance > 0 && tolerance < 1) ||
    ![options.maxSweeps, options.maxEntries, options.maxResidentEntries].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    ![options.retainedEntries, options.maxWork].every(
      (value: number): boolean => Number.isSafeInteger(value) && value >= 0,
    ) || !(options.minimumSingularRatio > 0 && options.minimumSingularRatio < 1)
  ) throw new Error("camera-sqp: bounded current model and options required");
  if (model.toPhysicalCovector === undefined) return fail("covector-action-unavailable");
  const length: (values: readonly number[]) => number = (
    values: readonly number[],
  ): number => {
    let value: number = 0;
    for (const entry of values) value = Math.hypot(value, entry);
    return value;
  };
  const spend: (amount: number) => boolean = (amount: number): boolean => {
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > options.maxWork - result.report.work)
      return false;
    charge(amount);
    result.report.work += amount;
    return true;
  };
  if (!spend(8 * m)) return fail("auxiliary-work-unavailable");
  let Z: number = 0, physicalZ: number = 0, H: number = 0;
  for (let at: number = 0; at < m; at++) {
    Z += model.rows[at]!.indices.length;
    physicalZ += model.physicalRows[at]!.indices.length;
    if (!Number.isFinite(weights[at]) || weights[at]! < 0)
      throw new Error("camera-sqp: finite nonnegative baseline weights required");
    if (at > 0 && weights[at]! > 0) H++;
  }
  result.report.selectedRows = H;
  const base: number = 2 * (Z + physicalZ) + 3 * m + 2 * n + 128;
  const initialExtra: number = 32 * n + 16 * m + 1024;
  if (![Z, physicalZ, base, initialExtra].every(Number.isSafeInteger)) return fail("capacity-unrepresentable");
  if (base + initialExtra > options.maxEntries || options.retainedEntries + initialExtra > options.maxResidentEntries)
    return fail("auxiliary-capacity-unavailable");
  if (!spend(16 * (Z + physicalZ + n + m))) return fail("auxiliary-work-unavailable");
  const map: Int32Array = new Int32Array(n).fill(-1);
  const c: number[] = new Array<number>(n).fill(0);
  const coordinates: number[] = [];
  for (let at: number = 0; at < m; at++) {
    const row: IAutoMovieSimplexAtom = model.rows[at]!;
    if (row.indices.length !== row.values.length || row.offset !== model.physicalRows[at]!.offset ||
        !Number.isFinite(row.offset) || row.offset < 0 || (at === 0 && row.offset !== 0))
      throw new Error("camera-sqp: identical feasible original offsets required");
    if (at > 0 && weights[at]! > 0) result.selected.push(at);
    for (let entry: number = 0; entry < row.indices.length; entry++) {
      const axis: number = row.indices[entry]!, value: number = row.values[entry]!;
      if (!Number.isSafeInteger(axis) || axis < 0 || axis >= n || !Number.isFinite(value))
        throw new Error("camera-sqp: finite admitted coordinates required");
      if (at === 0) c[axis] = value;
      else if (weights[at]! > 0 && value !== 0) map[axis] = -2;
    }
  }
  for (let axis: number = 0; axis < n; axis++)
    if (map[axis] === -2) { map[axis] = coordinates.length; coordinates.push(axis); }
  const q: number = coordinates.length;
  result.report.coordinates = q;
  if (H > q) return fail("working-rows-dependent-or-wide");
  const extra: number = initialExtra + 3 * q * H + 2 * H * H + 32 * H;
  const reserve: number =
    192 * options.maxSweeps * (q + H) * H * H + 256 * q * H * H +
    1024 * (Z + physicalZ + n + m + H * H) + 512 * n * n + 8192;
  if (![extra, reserve, q * H, H * H].every(Number.isSafeInteger)) return fail("capacity-unrepresentable");
  if (base + extra > options.maxEntries || options.retainedEntries + extra > options.maxResidentEntries ||
      q * H > options.maxEntries || H * H > options.maxEntries)
    return fail("auxiliary-capacity-unavailable");
  if (!spend(reserve)) return fail("auxiliary-work-unavailable");
  let factor: ReturnType<typeof decomposeAutoMovieSingularMatrix> | null = null;
  const z: number[] = c.map((value: number): number => -value);
  const lambda: number[] = new Array<number>(H).fill(0);
  if (H > 0) {
    const transpose: number[][] = Array.from({ length: q }, (): number[] => new Array<number>(H).fill(0));
    const right: number[] = [];
    for (let column: number = 0; column < H; column++) {
      const row: IAutoMovieSimplexAtom = model.rows[result.selected[column]!]!;
      let value: number = row.offset;
      for (let entry: number = 0; entry < row.indices.length; entry++) {
        const axis: number = row.indices[entry]!, coefficient: number = row.values[entry]!;
        value += coefficient * c[axis]!;
        if (coefficient !== 0) transpose[map[axis]!]![column] = coefficient;
      }
      right.push(value);
    }
    try {
      factor = decomposeAutoMovieSingularMatrix(transpose, {
        maxEntries: options.maxEntries, maxSweeps: options.maxSweeps,
        orthogonalityTolerance: 1e-12,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith("singular-matrix:"))
        return fail("working-factor-unresolved");
      throw error;
    }
    const largest: number = factor.singularValues[0]!;
    const ratio: number = factor.singularValues[H - 1]! / largest;
    result.report.designRatio = Number.isFinite(ratio) ? ratio : null;
    if (!(largest > 0) || factor.numericalRank !== H || !(ratio > options.minimumSingularRatio))
      return fail("working-rank-unresolved");
    for (let k: number = 0; k < H; k++) {
      let projection: number = 0;
      for (let at: number = 0; at < H; at++) projection += factor.rightColumns[k]![at]! * right[at]!;
      const amount: number = projection / factor.singularValues[k]!;
      for (let at: number = 0; at < q; at++) z[coordinates[at]!]! += factor.leftColumns[k]![at]! * amount;
    }
  }
  if (!z.every(Number.isFinite))
    return fail("working-dual-or-step-unresolved");
  let physical: number[] = model.fromMetric(z);
  if (physical.length !== n || !physical.every(Number.isFinite)) throw new Error("camera-sqp: physical metric action changed coordinates");
  const equalityRight: (step: readonly number[]) => number[] = (step: readonly number[]): number[] => result.selected.map(
    (at: number): number => {
      const row: IAutoMovieSimplexAtom = model.physicalRows[at]!;
      let value: number = row.offset;
      for (let entry: number = 0; entry < row.indices.length; entry++) value -= row.values[entry]! * step[row.indices[entry]!]!;
      return value;
    },
  );
  const beforeRight: number[] = equalityRight(physical);
  if (!beforeRight.every(Number.isFinite)) return fail("full-affine-qp-unqualified");
  const beforeError: number = beforeRight.reduce((maximum: number, value: number): number => Math.max(maximum, Math.abs(value)), 0);
  result.report.equalityBeforeRefinement = beforeError;
  if (factor !== null && beforeError > 0) {
    result.report.refinementAttempted = true;
    const adjustment: number[] = new Array<number>(n).fill(0);
    for (let k: number = 0; k < H; k++) {
      let projection: number = 0;
      for (let at: number = 0; at < H; at++) projection += factor.rightColumns[k]![at]! * beforeRight[at]!;
      const amount: number = projection / factor.singularValues[k]!;
      for (let at: number = 0; at < q; at++) adjustment[coordinates[at]!]! += factor.leftColumns[k]![at]! * amount;
    }
    for (let at: number = 0; at < n; at++) z[at]! += adjustment[at]!;
    if (!z.every(Number.isFinite)) return fail("working-equality-refinement-unresolved");
    physical = model.fromMetric(z);
    if (physical.length !== n || !physical.every(Number.isFinite)) throw new Error("camera-sqp: physical metric action changed coordinates");
    const afterRight: number[] = equalityRight(physical);
    const afterError: number = afterRight.reduce((maximum: number, value: number): number => Math.max(maximum, Math.abs(value)), 0);
    if (!Number.isFinite(afterError) || !(afterError < beforeError)) return fail("working-equality-refinement-unresolved");
  }
  if (factor !== null) for (let k: number = 0; k < H; k++) {
    let projection: number = 0;
    for (let at: number = 0; at < q; at++)
      projection += factor.leftColumns[k]![at]! * (z[coordinates[at]!]! + c[coordinates[at]!]!);
    const amount: number = -projection / factor.singularValues[k]!;
    for (let at: number = 0; at < H; at++) lambda[at]! += factor.rightColumns[k]![at]! * amount;
  }
  if (!lambda.every((value: number): boolean => Number.isFinite(value) && value >= 0)) return fail("working-dual-or-step-unresolved");
  const stationarity: number[] = model.toPhysicalCovector(z);
  if (physical.length !== n || stationarity.length !== n || !physical.every(Number.isFinite) || !stationarity.every(Number.isFinite))
    throw new Error("camera-sqp: physical metric action changed coordinates");
  let equality: number = 0, violation: number = 0, scale: number = 1, selectedAt: number = 0;
  for (let at: number = 0; at < m; at++) {
    const row: IAutoMovieSimplexAtom = model.physicalRows[at]!;
    const selected: boolean = at > 0 && result.selected[selectedAt] === at;
    const multiplier: number = at === 0 ? 1 : selected ? lambda[selectedAt++]! : 0;
    let value: number = -row.offset;
    for (let entry: number = 0; entry < row.indices.length; entry++) {
      const axis: number = row.indices[entry]!, coefficient: number = row.values[entry]!;
      value += coefficient * physical[axis]!;
      stationarity[axis]! += multiplier * coefficient;
      if (at === 0) scale = Math.max(scale, Math.abs(coefficient));
    }
    if (at > 0) {
      violation = Math.max(violation, value);
      if (selected) equality = Math.max(equality, Math.abs(value));
    }
  }
  const residual: number = stationarity.reduce((maximum: number, value: number): number => Math.max(maximum, Math.abs(value)), 0);
  Object.assign(result.report, { maximumViolation: violation, equalityResidual: equality, stationarityResidual: residual, stationarityScale: scale });
  if (![residual, violation, equality, scale].every(Number.isFinite) || violation > tolerance || equality > tolerance || residual > tolerance * scale)
    return fail("full-affine-qp-unqualified");
  result.report.qualified = true;
  result.sqpStep = physical;
  result.multipliers = lambda;
  const norm: number = length(physical), weight: number = Math.min(1, norm * norm);
  result.report.mixWeight = weight;
  result.report.nominalMixWeight = weight;
  if (!(weight > 0 && weight < 1)) return fail(weight === 1 ? "baseline-weight-one" : "zero-or-unresolved-sqp-norm");
  const mixture: ReturnType<typeof mixRecoveryFeasibleSqpStep> = mixRecoveryFeasibleSqpStep(model.physicalRows, physical, tilted, weight);
  Object.assign(result.report, { mixWeight: mixture.weight, numericalMixAttempted: mixture.numericalAttempted, numericalMixSupported: mixture.numericalSupported });
  if (mixture.step === null) return fail("mixed-affine-descent-unresolved");
  const mixed: number[] = mixture.step;
  result.step = mixed;
  result.report.reason = mixture.numericalSupported ? "full-affine-qp-numerical-mixture" : "full-affine-qp-mixed";
  if (factor === null) return result;
  const retainedFactor: NonNullable<typeof factor> = factor;
  const mixedNorm: number = length(mixed), tightening: number = mixedNorm ** 2.5;
  result.correct = (values: readonly number[]): number[] | null => {
    if (result.report.correctionAttempted) throw new Error("camera-sqp: one correction per base model required");
    result.report.correctionAttempted = true;
    if (values.length !== H || !values.every(Number.isFinite) || !(tightening > 0) || !Number.isFinite(tightening)) return null;
    const right: number[] = result.selected.map((at: number, index: number): number =>
      -values[index]! - length(model.physicalRows[at]!.values) * tightening,
    );
    if (!right.every(Number.isFinite)) return null;
    const correction: number[] = new Array<number>(n).fill(0);
    for (let k: number = 0; k < H; k++) {
      let projection: number = 0;
      for (let at: number = 0; at < H; at++) projection += retainedFactor.rightColumns[k]![at]! * right[at]!;
      const amount: number = projection / retainedFactor.singularValues[k]!;
      for (let at: number = 0; at < q; at++) correction[coordinates[at]!]! += retainedFactor.leftColumns[k]![at]! * amount;
    }
    const answer: number[] = model.fromMetric(correction);
    if (answer.length !== n || !answer.every(Number.isFinite) || !(length(answer) <= mixedNorm)) return null;
    for (let at: number = 0; at < H; at++) {
      const row: IAutoMovieSimplexAtom = model.physicalRows[result.selected[at]!]!;
      let value: number = -right[at]!;
      for (let entry: number = 0; entry < row.indices.length; entry++) value += row.values[entry]! * answer[row.indices[entry]!]!;
      if (!Number.isFinite(value) || Math.abs(value) > tolerance * Math.max(1, Math.abs(right[at]!))) return null;
    }
    result.report.correctionSupported = true;
    return answer;
  };
  return result;
}
