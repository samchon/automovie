import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticEntries } from "./HumanQuadraticEntries";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/** The record of `IHumanQuadraticSolveResidual`'s site. */
type IHumanQuadraticSolveResidual = { primal: number; dual: number };

/**
 * Run the existing OSQP iteration on admitted, equilibrated numeric data.
 * Public one-shot solves and fixed-matrix models share this numeric owner.
 *
 * @param rows Current original row keys, unchanged throughout the synchronous
 *   solve.
 * @param s Admitted equilibrated matrices and current scaled intervals in this
 *   row order.
 * @param tolerance The public solver's unchanged relative residual tolerance.
 * @param warm Optional caller-owned unscaled iterates of these ordered rows.
 * @param duals Optional keyed unscaled multipliers when warm is absent.
 * @param memory Optional model-owned scratch; no returned iterate aliases it.
 * @returns Fresh unscaled iterates with the existing termination diagnostics.
 * @throws {RangeError} For incompatible warm data or nonfinite numerical
 *   results.
 */
export function HumanQuadraticSolve(
  rows: readonly Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "key">[],
  s: B.IScaled,
  tolerance: number,
  warm?: IAutoMovieMotionHumanQuadraticProgram.IState,
  duals?: ReadonlyMap<string, number>,
  memory?: Workspace.IMemory,
): IAutoMovieMotionHumanQuadraticProgram.IState {
  const {
    n,
    m,
    start,
    cols,
    vals,
    singleton,
    lo,
    hi,
    weight,
    d,
    e,
  }: B.IScaled = s;
  const c: number = s.c;

  // Each row's step size: an equality row's a thousand times the step, a
  // row bounded on neither side the least (section 5.2).
  let base: number = RHO0;
  let rho: Float64Array = memory?.rho ?? new Float64Array(m);
  let thresholds: Float64Array = memory?.thresholds ?? new Float64Array(m);
  const rowRhs: Float64Array = memory?.rowRhs ?? new Float64Array(m);
  const softUpper: Float64Array = memory?.softUpper ?? new Float64Array(m);
  const softLower: Float64Array = memory?.softLower ?? new Float64Array(m);

  // Adaptation supplies both vectors so its new rho emits the next rhs
  // product and soft cuts; initial row-state production emits them later.
  const steps: (currentZ?: Float64Array, currentY?: Float64Array) => boolean = (
    currentZ?: Float64Array,
    currentY?: Float64Array,
  ): boolean => {
    let finite: boolean = true;
    for (let r: number = 0; r < m; ++r) {
      const step: number =
        lo[r] === -Infinity && hi[r] === Infinity
          ? RHO_MIN
          : lo[r] === hi[r]
            ? EQUALITY * base
            : base;
      rho[r] = step;
      thresholds[r] = weight[r]! < 0 ? 0 : weight[r]! / step;
      if (currentZ !== undefined) {
        const value: number = step * currentZ[r]! - currentY![r]!;
        rowRhs[r] = value;
        if (!Number.isFinite(value)) finite = false;
        if (weight[r]! >= 0) {
          softUpper[r] = hi[r]! + thresholds[r]!;
          softLower[r] = lo[r]! - thresholds[r]!;
        }
      }
    }
    return finite;
  };
  if (memory === undefined || memory.resetSteps) {
    steps();
    if (memory !== undefined) memory.resetSteps = false;
  }
  let factor: Workspace.IFactor =
    memory?.initialFactor ?? Preparation.factor(s, rho, SIGMA);
  if (memory !== undefined) memory.initialFactor = factor;

  // The iterates in the scaled problem: x̄ = D⁻¹x, z̄ = E z, ȳ = c E⁻¹ y.
  const spare: Workspace.IMemory["spare"] = memory?.spare;
  if (memory !== undefined) memory.spare = undefined;
  let x: Float64Array = spare?.x ?? new Float64Array(n);
  let z: Float64Array = spare?.z ?? new Float64Array(m);
  let y: Float64Array = spare?.y ?? new Float64Array(m);
  let finiteRows: boolean = true;
  if (spare !== undefined && warm === undefined) {
    x.fill(0);
    y.fill(0);
  }
  if (warm !== undefined) {
    if (warm.x.length !== n || warm.z.length !== m || warm.y.length !== m)
      throw new RangeError("Malformed quadratic warm start");
    for (let i: number = 0; i < n; ++i) {
      const value: number = warm.x[i]!;
      if (!Number.isFinite(value))
        throw new RangeError("Malformed quadratic warm start");
      x[i] = value / d[i]!;
    }
    for (let r: number = 0; r < m; ++r) {
      const value: number = warm.z[r]!;
      const multiplier: number = warm.y[r]!;
      if (!Number.isFinite(value) || !Number.isFinite(multiplier))
        throw new RangeError("Malformed quadratic warm start");
      const scaledZ: number = value * e[r]!;
      const scaledY: number = (c * multiplier) / e[r]!;
      z[r] = scaledZ;
      y[r] = scaledY;
      const product: number = rho[r]! * scaledZ - scaledY;
      rowRhs[r] = product;
      if (!Number.isFinite(product)) finiteRows = false;
      if (weight[r]! >= 0) {
        softUpper[r] = hi[r]! + thresholds[r]!;
        softLower[r] = lo[r]! - thresholds[r]!;
      }
    }
  } else
    for (let r: number = 0; r < m; ++r) {
      const row: Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "key"> =
        rows[r]!;

      // A solve of new rows starts from the multipliers of the rows they
      // linearise again (`Q.IRow.key`), the primal at the iterate itself.
      const known: number | undefined =
        row.key === undefined || duals === undefined
          ? undefined
          : duals.get(row.key);
      if (known !== undefined) {
        if (!Number.isFinite(known))
          throw new RangeError(`Quadratic row ${r} multiplier must be finite`);
        y[r] = (c * known) / e[r]!;
      }
      const value: number = Math.min(hi[r]!, Math.max(lo[r]!, 0));
      z[r] = value;
      const product: number = rho[r]! * value - y[r]!;
      rowRhs[r] = product;
      if (!Number.isFinite(product)) finiteRows = false;
      if (weight[r]! >= 0) {
        softUpper[r] = hi[r]! + thresholds[r]!;
        softLower[r] = lo[r]! - thresholds[r]!;
      }
    }
  const rhs: Float64Array = memory?.work.transpose ?? new Float64Array(n);
  const xt: Float64Array = memory?.work.curvature ?? new Float64Array(n);
  const before: Float64Array = memory?.work.rows ?? new Float64Array(m);
  const work: Workspace.IWork = memory?.work ?? Workspace(rhs, xt, before);
  let status: IAutoMovieMotionHumanQuadraticProgram.IState["status"] =
    "unfinished";
  const residual: IHumanQuadraticSolveResidual = {
    primal: Infinity,
    dual: Infinity,
  };
  for (let it: number = 0; it < ITERATIONS; ++it) {
    const check: boolean = (it + 1) % CHECK === 0 || it + 1 === ITERATIONS;

    // Column gathers preserve each rhs component's original row/duplicate
    // sequence, including its initial SIGMA*x-q. A producer-proved finite
    // row vector permits compression; exceptional products stay original.
    if (finiteRows) {
      const order: B.IScaled["transpose"] = s.transpose;
      for (let i: number = 0; i < n; ++i) {
        let value: number = SIGMA * x[i]! - s.q[i]!;
        const end: number = order.start[i + 1]!;
        for (let a: number = order.start[i]!; a < end; ++a)
          value += vals[order.entries[a]!]! * rowRhs[order.rows[a]!]!;
        rhs[i] = value;
      }
    } else {
      for (let i: number = 0; i < n; ++i) rhs[i] = SIGMA * x[i]! - s.q[i]!;
      for (let r: number = 0; r < m; ++r) {
        const w: number = rowRhs[r]!;
        if (Number.isFinite(w)) {
          const single: number = singleton[r]!;
          if (single >= 0) rhs[cols[single]!]! += vals[single]! * w;
          else {
            const end: number = start[r + 1]!;
            for (let a: number = start[r]!; a < end; ++a)
              rhs[cols[a]!]! += vals[a]! * w;
          }
        } else {
          const row: ReturnType<typeof HumanQuadraticEntries> =
            HumanQuadraticEntries(s, r);
          for (let a: number = 0; a < row.index.length; ++a)
            rhs[row.index[a]!]! += row.coef[a]! * w;
        }
      }
    }
    const finiteXt: boolean = B.substitute(factor, rhs, xt, x, ALPHA);

    // Only a termination/certificate check reads the previous multipliers;
    // every row update reads only its own unchanged y entry and shared xt.
    if (check) before.set(y);

    // x does not enter these row products or prox steps; consume each
    // unchanged xt product directly instead of storing a separate vector.
    finiteRows = true;
    for (let r: number = 0; r < m; ++r) {
      let product: number = 0;
      if (finiteXt) {
        const single: number = singleton[r]!;
        if (single >= 0) product = 0 + vals[single]! * xt[cols[single]!]!;
        else {
          const end: number = start[r + 1]!;
          for (let a: number = start[r]!; a < end; ++a)
            product += vals[a]! * xt[cols[a]!]!;
        }
      } else {
        const row: ReturnType<typeof HumanQuadraticEntries> =
          HumanQuadraticEntries(s, r);
        for (let a: number = 0; a < row.index.length; ++a)
          product += row.coef[a]! * xt[row.index[a]!]!;
      }
      const step: number = rho[r]!;
      const multiplier: number = y[r]!;
      const relaxed: number = ALPHA * product + (1 - ALPHA) * z[r]!;
      const v: number = relaxed + multiplier / step;
      const l: number = lo[r]!;
      const u: number = hi[r]!;
      let next: number;
      if (weight[r]! < 0) next = Math.min(u, Math.max(l, v));
      else {
        const t: number = thresholds[r]!;
        next =
          v > softUpper[r]!
            ? v - t
            : v > u
              ? u
              : v < softLower[r]!
                ? v + t
                : v < l
                  ? l
                  : v;
      }
      const nextY: number = multiplier + step * (relaxed - next);
      y[r] = nextY;
      z[r] = next;
      const nextRhs: number = step * next - nextY;
      rowRhs[r] = nextRhs;
      if (!Number.isFinite(nextRhs)) finiteRows = false;
    }
    if (!check) continue;

    // Termination on the unscaled residuals (section 3.4).
    const at: B.IResiduals = B.residuals(s, x, z, y, work);
    if (
      !Number.isFinite(at.primal) ||
      !Number.isFinite(at.primalScale) ||
      !Number.isFinite(at.dual) ||
      !Number.isFinite(at.dualScale) ||
      !Number.isFinite(at.scaledPrimal) ||
      !Number.isFinite(at.scaledPrimalScale) ||
      !Number.isFinite(at.scaledDual) ||
      !Number.isFinite(at.scaledDualScale)
    )
      throw new RangeError("Quadratic iteration produced a nonfinite residual");
    residual.primal = at.primal;
    residual.dual = at.dual;
    if (
      at.primal <= ABSOLUTE + tolerance * at.primalScale &&
      at.dual <= ABSOLUTE + tolerance * at.dualScale
    ) {
      status = "solved";
      break;
    }

    // A certificate of primal infeasibility of the hard rows (section 3.4).
    if (B.infeasible(s, y, before, INFEASIBLE, work)) {
      status = "infeasible";
      break;
    }

    // The step size balancing the scaled residuals (section 5.2).
    const ratio: number = Math.sqrt(
      at.scaledPrimal /
        Math.max(1e-12, at.scaledPrimalScale) /
        Math.max(1e-12, at.scaledDual / Math.max(1e-12, at.scaledDualScale)),
    );
    const next: number = Math.min(RHO_MAX, Math.max(RHO_MIN, base * ratio));
    if (next > ADAPT * base || next < base / ADAPT) {
      base = next;

      // A fixed model's baseline always means RHO0, independently of the
      // preceding solve's last adaptation. Overwrite a separate pair here
      // so the next solve starts from its unchanged exact initial policy.
      if (memory !== undefined && rho === memory.rho) {
        const adapted: NonNullable<Workspace.IMemory["adapted"]> =
          (memory.adapted ??= {
            rho: new Float64Array(m),
            thresholds: new Float64Array(m),
          });
        rho = adapted.rho;
        thresholds = adapted.thresholds;
      }
      finiteRows = steps(z, y);
      factor = B.factor(s, rho, SIGMA, work);
    }
  }

  // Polishing on the active set (section 4).
  if (status === "solved") {
    const polished: ReturnType<typeof B.polish> | undefined = B.polish(
      s,
      z,
      y,
      DELTA,
      REFINE,
      work,
    );
    if (polished !== undefined) {
      const at: B.IResiduals = B.residuals(
        s,
        polished.x,
        polished.z,
        polished.y,
        work,
        polished.products,
      );
      const primalOk: boolean =
        Number.isFinite(at.primal) &&
        Number.isFinite(at.primalScale) &&
        (at.primal <= residual.primal ||
          at.primal <= ABSOLUTE + tolerance * at.primalScale);
      const dualOk: boolean =
        Number.isFinite(at.dual) &&
        Number.isFinite(at.dualScale) &&
        (at.dual <= residual.dual ||
          at.dual <= ABSOLUTE + tolerance * at.dualScale);
      if (primalOk && dualOk) {
        if (memory !== undefined) memory.spare = { x, z, y };
        x = polished.x;
        z = polished.z;
        y = polished.y;
        residual.primal = at.primal;
        residual.dual = at.dual;
        status = "polished";
      } else if (memory !== undefined)
        memory.spare = { x: polished.x, z: polished.z, y: polished.y };
    }
  }

  // Transfer the call-owned iterates after their final scaled use:
  // x = D x̄, z = E⁻¹ z̄, y = E ȳ / c.
  const out: IAutoMovieMotionHumanQuadraticProgram.IState = {
    x,
    z,
    y,
    status,
    residual,
  };
  let finite: boolean = true;
  for (let i: number = 0; i < n; ++i) {
    out.x[i] = d[i]! * x[i]!;
    if (!Number.isFinite(out.x[i]!)) finite = false;
  }
  for (let r: number = 0; r < m; ++r) {
    out.z[r] = z[r]! / e[r]!;
    out.y[r] = (e[r]! * y[r]!) / c;
    if (!Number.isFinite(out.z[r]!) || !Number.isFinite(out.y[r]!))
      finite = false;
  }
  if (!finite)
    throw new RangeError("Quadratic unscaling produced a nonfinite iterate");
  return out;
}

/** The step size the solve starts from (OSQP's default). */
const RHO0: number = 0.1;

/** The least and the greatest step size (OSQP's bounds). */
const RHO_MIN: number = 1e-6;
const RHO_MAX: number = 1e6;

/** An equality row's step size as a multiple of the others' (OSQP's). */
const EQUALITY: number = 1e3;

/**
 * The factor the estimated step size must leave the current one by before the
 * system is factored again (OSQP's adaptive tolerance).
 */
const ADAPT: number = 5;

/** The proximal term that keeps the step's system definite (OSQP's σ). */
const SIGMA: number = 1e-6;

/** Over-relaxation (OSQP's α). */
const ALPHA: number = 1.6;

/**
 * ADMM iterations per solve at most, a guard behind the residual test (OSQP's
 * default).
 */
const ITERATIONS: number = 4000;

/** Iterations between two residual tests (OSQP's default). */
const CHECK: number = 25;

/**
 * The residual tests' absolute tolerance (OSQP's default); the public owner
 * supplies its unchanged relative tolerance.
 */
const ABSOLUTE: number = 1e-3;

/** The primal infeasibility certificate's tolerance (OSQP's default). */
const INFEASIBLE: number = 1e-4;

/** The polishing system's regularisation (OSQP's δ). */
const DELTA: number = 1e-6;

/** Iterative refinement steps of the polishing solve (OSQP's default). */
const REFINE: number = 3;
