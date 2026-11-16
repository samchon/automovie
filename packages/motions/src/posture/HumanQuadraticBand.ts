import { HumanQuadraticCholesky } from "./HumanQuadraticCholesky";
import { HumanQuadraticEntries } from "./HumanQuadraticEntries";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";
import { HumanQuadraticResiduals } from "./HumanQuadraticResiduals";
import { HumanQuadraticRow } from "./HumanQuadraticRow";
import { HumanQuadraticSubstitute } from "./HumanQuadraticSubstitute";
import { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/**
 * The linear algebra of `HumanQuadraticProgram`'s OSQP solve on a banded
 * problem: the banded reduced KKT system and
 * its Cholesky factor, the unscaled residuals, the primal infeasibility
 * certificate and the polishing solve on the active set (Stellato et al.
 * 2020, Math Program Comput 12:637, sections 3.4, 4 and 5.1).
 * Costs use w=band+1, S supplied curvature entries, Z stored row entries
 * and m rows; a row r stores k_r entries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the banded OSQP algebra, scaled input contract, residuals, infeasibility certificate and active-set polish.
 * @evidence contracts/development/design.md#principled-representation Groups scaled quadratic data and residual diagnostics for the reduced OSQP systems; finite admitted data and convex curvature are supplied by the solver and its callers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes only algebra consumed by HumanQuadraticProgram and its numeric preparation; no action vocabulary or external solver interface is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps generic band and sparse-row data, including duplicates and empty rows; the existing Cholesky diagonal floor is a stated numerical guard rather than a convexity validator.
 */
export namespace HumanQuadraticBand {
  /**
   * Equilibrated data: `P̄ = c D P D`, `q̄ = c D q`, `Ā = E A D`,
   * `l̄ = E l`, `ū = E u`, and soft weight `c w / E`.
   *
   * @evidence contracts/development/design.md#principled-representation Stores an upper-band symmetric P, ordered CSR rows and positive D/E/c transformations; Preparation admits finite matrices and preserves absent infinite bounds, while types alone cannot enforce dimensions or convexity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies matrices, intervals, penalties, scales and diagonal metadata to the existing readers; a fresh solve additionally borrows original rows and owns lazy exceptional restoration, excluded from the retained numeric core.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains generic dimensions/duplicates without a body category; -1 remains the hard-row sentinel. Numeric core arrays and solve-local original rows stay unchanged, and exceptional products restore actual zeros instead of suppressing nonfinite propagation.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the scaling equations, compression offsets, hard-weight sentinel and the purpose of each numeric member.
   */
  export interface IScaled {
    /** The variables. */
    n: number;

    /** The rows. */
    m: number;

    /** The half-bandwidth. */
    band: number;

    /** The scaled curvature's in-range upper band, without unused trailing padding. */
    p: Float64Array[];

    /** Admitted canonical P is exactly diagonal; finite positive Ruiz factors preserve its off-diagonal signed zeros, and factors still use the full band. */
    diagonal: boolean;

    /** The scaled linear term. */
    q: Float64Array;

    /** Each row's first entry, compressed; `start[m]` is the entries' count. */
    start: Int32Array;

    /** Each entry's variable. */
    cols: Int32Array;

    /** Each entry's scaled coefficient. */
    vals: Float64Array;

    /** One when a row's retained column indices are nondecreasing; duplicate columns stay in their original order. */
    ordered: Uint8Array;

    /** Original admitted rows, borrowed unchanged only for this fresh solve wrapper's exceptional zero-product restoration; excluded from retained preparation. */
    raw: readonly Q.IRow[];

    /** Lazily restored exceptional rows for this solve only; at most the original row storage and never part of the prepared core or returned iterates. */
    restored?: Map<number, Pick<Q.IRow, "index" | "coef">>;

    /** Each row's scaled lower end. */
    lo: Float64Array;

    /** Each row's scaled upper end. */
    hi: Float64Array;

    /** Each soft row's scaled weight; -1 for a hard row. */
    weight: Float64Array;

    /** The variables' scaling `D`. */
    d: Float64Array;

    /** The rows' scaling `E`. */
    e: Float64Array;

    /** The cost's scaling. */
    c: number;

    /** Each unchanged 1/(c*d[i]) for residual unit reversal; residual admission retains the original nonfinite-result handling. */
    unscale: Float64Array;
  }

  /**
   * Infinity-norm residuals and their normalization scales, in both original
   * and equilibrated units. The solver rejects nonfinite iteration values.
   *
   * @evidence contracts/development/design.md#principled-representation Separates original-unit primal/dual residuals from scaled ones and records each normalization magnitude; numeric finiteness remains a runtime solver check.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains the eight values the existing termination, polishing acceptance and adaptive-rho decisions read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same infinity norms for all dimensions and actions without invented physical tolerances or fixture-specific fields.
   * @evidence contracts/development/common.md#meaningful-documentation States every residual equation, its units and normalization, and which solver decision consumes it.
   */
  export interface IResiduals {
    /** The unscaled primal residual `‖Ax - z‖∞`. */
    primal: number;

    /** Its scale, `max(‖Ax‖∞, ‖z‖∞)`. */
    primalScale: number;

    /** The unscaled dual residual `‖Px + q + Aᵀy‖∞`. */
    dual: number;

    /** Its scale, `max(‖Px‖∞, ‖Aᵀy‖∞, ‖q‖∞)`. */
    dualScale: number;

    /** The scaled primal residual. */
    scaledPrimal: number;

    /** Its scale. */
    scaledPrimalScale: number;

    /** The scaled dual residual. */
    scaledDual: number;

    /** Its scale. */
    scaledDualScale: number;
  }

  /**
   * The Cholesky factor of the reduced step system `P̄ + σI + Āᵀ diag(ρ) Ā`.
   *
   * @param s The scaled problem.
   * @param rho Each row's step size.
   * @param sigma The proximal term.
   * @param work Optional mutable owner for adaptive factorizations; absent for the independently cached initial factor.
   * @returns Upper U of K=UᵀU; with work it is overwritten by that solve's next factorization.
   * @throws {Error} When a row couples variables beyond the band.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Forms the cited indirect OSQP reduced system and banded Cholesky factor; convex P and positive rho/sigma are caller premises, with the existing diagonal guard documented by HumanQuadraticCholesky.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resets canonical upper storage, adds the proximal diagonal and row products, then overwrites that system with U through one Cholesky helper.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all row contributions, including duplicate indices, and the band-coupling rejection; no threshold or physical tolerance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Assembly takes O(n*w+sum(k_r*k_r)) and Cholesky O(n*w*w); canonical bands need O(n*w) storage and repeated solve-local factorizations allocate no matrix arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Preparation may retain an independent initial factor; adaptive calls reuse only owned matrix storage and reset every P entry before recomputing the current rho-weighted system.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Calls without work own a fresh in-place factor; calls with work overwrite one solve-owned band, which never aliases the prepared initial factor or returned iterates.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the matrix equation, parameter roles, band failure and convex-data premise.
   */
  export function factor(
    s: IScaled,
    rho: Float64Array,
    sigma: number,
    work?: Work.IWork,
  ): Float64Array[] {
    const matrices: Work.IFactor = Work.system(s, sigma, work);
    const k: Float64Array[] = matrices.system;
    for (let r: number = 0; r < s.m; ++r)
      HumanQuadraticRow(s, k, r, rho[r]!);
    return HumanQuadraticCholesky(k, s.n, s.band);
  }

  /**
   * Solve `Uᵀ U x = b` into `x`, using the in-place upper factor.
   *
   * @param u Canonical upper factor, each row storing min(band+1,n-i) entries.
   * @param n The size.
   * @param band The half-bandwidth.
   * @param b The right-hand side.
   * @param x The solution.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses forward and backward triangular substitution for the supplied finite nonsingular Cholesky factor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the original two band-limited sweeps to HumanQuadraticSubstitute, shared with active polishing, into the caller's destination in the same scalar order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Solves every in-band contribution without dropping coefficients or changing precision thresholds; valid dimensions and factor remain internal caller premises.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(n*w) time, including diagonal systems, and O(1) auxiliary storage beyond the supplied destination.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads an unchanged factor across right-hand sides; upper row lengths encode the backward bound and each stored U(t,i) is the original L(i,t) value.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates no arrays and retains nothing; only the caller-owned output x is changed.
   * @evidence contracts/development/common.md#meaningful-documentation States the factored equation, band layout, input-factor premise and destination mutation.
   */
  export function substitute(
    u: Float64Array[],
    n: number,
    band: number,
    b: Float64Array,
    x: Float64Array,
  ): void {
    HumanQuadraticSubstitute(u, n, band, b, x);
  }

  /**
   * The residuals of an iterate of the scaled problem (section 3.4): the
   * primal `‖Ax - z‖∞` and the dual `‖Px + q + Aᵀy‖∞` of the unscaled
   * problem with the scales the termination test reads, and the same of the
   * scaled problem, which the step size balances.
   *
   * @param s The scaled problem.
   * @param x The scaled variables.
   * @param z The scaled row values.
   * @param y The scaled multipliers.
   * @param work Disposable solve-local products and diagnostic record.
   * @param known Optional completed Ax and A-transpose-y from the immediate polish producer; x, y and A must be unchanged.
   * @returns Borrowed residuals, overwritten by the next residual check.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the cited primal Ax-z and dual Px+q+A-transpose-y infinity norms and reverses D/E/c scaling for the original-unit termination check.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the complete ordered products and norm measurement to HumanQuadraticResiduals, separating diagnostics from factorization and active polishing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every stored contribution and its ordered accumulation in computed or producer-supplied products; all original unscaled/scaled infinity norms and tolerances remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Normal checks take O(Z+m+n*w); supplied products take O(m+n*w), and exact diagonal finite-x curvature replaces n*w by n. Exceptional products may visit R original entries and acquire solve-local restored rows; normal checks allocate no numeric arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the prepared unchanged 1/(c*d[i]) values; normal checks rebuild all products and only the immediate post-polish reader reuses completed Ax and A-transpose-y for unchanged x/y/A, while Px and every residual norm are still evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Products and borrowed diagnostics belong to the solve workspace; the solver copies accepted scalar diagnostics before another check may overwrite them.
   * @evidence contracts/development/common.md#meaningful-documentation Defines both residual equations, the unit reversal and the normalization values used by termination and rho adaptation.
   */
  export function residuals(
    s: IScaled,
    x: Float64Array,
    z: Float64Array,
    y: Float64Array,
    work: Work.IWork,
    known?: Pick<Work.IWork, "rows" | "transpose">,
  ): IResiduals {
    return HumanQuadraticResiduals(s, x, z, y, work, known);
  }

  /**
   * Whether the multipliers' last change certifies the hard rows primal
   * infeasible (section 3.4): `δy` with `‖Aᵀδy‖∞ <= ε ‖δy‖∞` and
   * `uᵀ max(δy, 0) + lᵀ min(δy, 0) < -ε ‖δy‖∞`, read unscaled. A soft row
   * is never infeasible, so it is left out.
   *
   * @param s The scaled problem.
   * @param y The scaled multipliers.
   * @param before Their values one iteration before, consumed as delta-y scratch; the next ADMM iteration overwrites them.
   * @param epsilon The certificate's tolerance.
   * @param work Disposable solve-local transpose product.
   * @returns Whether the rows are certified infeasible.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Tests the cited primal-infeasibility certificate on original-unit hard-row multiplier changes, with the support function of each possibly unbounded interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the hard-row delta and its support, rejects a missing separating direction, then checks its transpose product norm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Excludes soft rows because their penalties permit interval violations; keeps the existing epsilon and honest infinite-bound support behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Normal checks take O(m+Z+n) without new vectors, reusing before and transpose; exceptional multiplier changes may restore and visit R original row entries through the solve-local owner.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Recomputes the certificate from current iterates and intervals; before is disposable after this check and the next ADMM prox overwrites every entry before it is read again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Changes only solve-local before and transpose scratch, zeroes soft-row deltas and returns a boolean without retaining data.
   * @evidence contracts/development/common.md#meaningful-documentation States the certificate inequalities, original units, soft-row exclusion and behavior for absent bounds or a zero direction.
   */
  export function infeasible(
    s: IScaled,
    y: Float64Array,
    before: Float64Array,
    epsilon: number,
    work: Work.IWork,
  ): boolean {
    const delta: Float64Array = before;
    let size: number = 0;
    let support: number = 0;
    for (let r: number = 0; r < s.m; ++r) {
      if (s.weight[r]! >= 0) {
        delta[r] = 0;
        continue;
      }
      const v: number = (s.e[r]! * (y[r]! - before[r]!)) / s.c;
      delta[r] = v;
      size = Math.max(size, Math.abs(v));
      const u: number = s.hi[r]! / s.e[r]!;
      const l: number = s.lo[r]! / s.e[r]!;
      if (v > 0) support += u === Infinity ? Infinity : u * v;
      else if (v < 0) support += l === -Infinity ? Infinity : l * v;
    }
    if (!(size > 0) || !(support < -epsilon * size)) return false;
    // Aᵀδy unscaled: D⁻¹ Āᵀ E⁻¹ δy.
    const aty: Float64Array = work.transpose;
    aty.fill(0);
    for (let r: number = 0; r < s.m; ++r) {
      const change: number = delta[r]!;
      const scale: number = s.e[r]!;
      if (Number.isFinite(change)) {
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) {
          const index: number = s.cols[a]!;
          aty[index] = aty[index]! + (s.vals[a]! * change) / scale;
        }
      } else {
        const row: ReturnType<typeof HumanQuadraticEntries> = HumanQuadraticEntries(s, r);
        for (let a: number = 0; a < row.index.length; ++a) {
          const index: number = row.index[a]!;
          aty[index] = aty[index]! + (row.coef[a]! * change) / scale;
        }
      }
    }
    let norm: number = 0;
    for (let i: number = 0; i < s.n; ++i)
      norm = Math.max(norm, Math.abs(aty[i]! / s.d[i]!));
    return norm <= epsilon * size;
  }

  /**
   * The solution polished on its active set (section 4): the rows held on a
   * bound (a hard row whose value and multiplier say so, a soft row resting
   * on its bound with its multiplier below its weight) as equalities, a soft
   * row past its bound with its multiplier fixed at its weight, every other
   * row free; the KKT system of those rows, regularised by `δ`, solved in
   * its banded reduced form and refined `refine` times toward the system
   * without it.
   *
   * @param s The scaled problem.
   * @param z The scaled row values.
   * @param y The scaled multipliers.
   * @param delta The regularisation.
   * @param refine The refinement steps.
   * @param work Disposable ADMM buffers after that phase has ended.
   * @returns Scaled candidate iterates and borrowed products for their immediate residual admission before x, y or A changes.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Implements the cited active-set regularized KKT solve and iterative refinement; the outer solver accepts its result only when the original residual checks permit it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects bound rows and fixed soft multipliers, factors their reduced system once, then shares its factor and overwrite buffers across the initial solve and refinement passes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps existing delta, active-row rules and refinement count; the Cholesky diagonal guard is retained and a polish is not itself a success certificate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Finite assembly takes O(n*w+sum(active k_r*k_r)), factorization O(n*w*w), and each refinement O(n*w+Z+m), with O(n*w+n+m) work storage; exceptional products may additionally restore/visit R original entries, while exact diagonal finite-x curvature takes O(n).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rebuilds the active system and shares its refinement factor; active multipliers accumulate in final coordinates, consumed before holds residuals, and final x/y share one ordered Ax/A-transpose-y pass. Only nonfinite operands request original zero terms from the same solve's restoration owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate x/z and the local multiplier vector are independent of scratch; consumed before first holds active constraint residuals and then final Ax, while the cost-rhs buffer holds final A-transpose-y only after its refinement use ends; neither buffer escapes in public state.
   * @evidence contracts/development/common.md#meaningful-documentation Describes hard and soft active rows, regularized reduction, iterative refinement, scaled outputs and outer acceptance ownership.
   */
  export function polish(
    s: IScaled,
    z: Float64Array,
    y: Float64Array,
    delta: number,
    refine: number,
    work: Work.IWork,
  ): {
    x: Float64Array;
    z: Float64Array;
    y: Float64Array;
    products: Pick<Work.IWork, "rows" | "transpose">;
  } {
    const active: number[] = [];
    const bound: number[] = [];
    const fixed: Float64Array = new Float64Array(s.m);
    for (let r: number = 0; r < s.m; ++r) {
      const l: number = s.lo[r]!;
      const u: number = s.hi[r]!;
      const w: number = s.weight[r]!;
      if (w < 0) {
        if (l === u || z[r]! - l < -y[r]!) {
          active.push(r);
          bound.push(l);
        } else if (u - z[r]! < y[r]!) {
          active.push(r);
          bound.push(u);
        }
      } else if (z[r]! > l && z[r]! < u) continue;
      else if (Math.abs(y[r]!) < w && (z[r] === l || z[r] === u)) {
        active.push(r);
        bound.push(z[r]!);
      } else fixed[r] = Math.sign(y[r]!) * w;
    }

    // The reduced system P̄ + δI + Σ āᵢ āᵢᵀ / δ over the active rows.
    const matrices: Work.IFactor = Work.system(s, delta, work);
    const k: Float64Array[] = matrices.system;
    const rowWeight: number = 1 / delta;
    for (const r of active) HumanQuadraticRow(s, k, r, rowWeight);
    const upper: Float64Array[] = HumanQuadraticCholesky(k, s.n, s.band);

    /** Keep the original subtraction order in both fixed-row right-hand sides, restoring exceptional zero products only when needed. */
    const subtract: (out: Float64Array, r: number, multiplier: number) => void = (
      out: Float64Array,
      r: number,
      multiplier: number,
    ): void => {
      if (Number.isFinite(multiplier)) {
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
          out[s.cols[a]!] = out[s.cols[a]!]! - s.vals[a]! * multiplier;
      } else {
        const row: ReturnType<typeof HumanQuadraticEntries> = HumanQuadraticEntries(s, r);
        for (let a: number = 0; a < row.index.length; ++a)
          out[row.index[a]!] = out[row.index[a]!]! - row.coef[a]! * multiplier;
      }
    };

    // The right-hand side: -q̄ less the fixed multipliers' rows.
    const rhs: Float64Array = work.transpose;
    for (let i: number = 0; i < s.n; ++i) rhs[i] = -s.q[i]!;
    for (let r: number = 0; r < s.m; ++r)
      if (fixed[r] !== 0) subtract(rhs, r, fixed[r]!);
    const dot: (r: number, v: Float64Array, finite: boolean) => number = (
      r: number,
      v: Float64Array,
      finite: boolean,
    ): number => {
      let out: number = 0;
      if (!finite) {
        const row: ReturnType<typeof HumanQuadraticEntries> = HumanQuadraticEntries(s, r);
        for (let a: number = 0; a < row.index.length; ++a)
          out += row.coef[a]! * v[row.index[a]!]!;
        return out;
      }
      const end: number = s.start[r + 1]!;
      for (let a: number = s.start[r]!; a < end; ++a)
        out += s.vals[a]! * v[s.cols[a]!]!;
      return out;
    };

    // The regularised KKT system [P̄ + δI, Āᵀ; Ā, -δI] [Δx; Δy] = [r₁; r₂],
    // reduced: Δy = (Ā Δx - r₂) / δ.
    const xs: Float64Array = new Float64Array(s.n);
    let finiteXS: boolean = true;
    const b: Float64Array = Float64Array.from(rhs);
    const r2: Float64Array = work.rows;
    for (let j: number = 0; j < bound.length; ++j) r2[j] = bound[j]!;
    const dx: Float64Array = work.curvature;
    const step: () => void = (): void => {
      active.forEach((r: number, j: number): void => {
        const residual: number = r2[j]!;
        if (Number.isFinite(residual)) {
          for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
            b[s.cols[a]!] = b[s.cols[a]!]! + (s.vals[a]! * residual) / delta;
        } else {
          const row: ReturnType<typeof HumanQuadraticEntries> = HumanQuadraticEntries(s, r);
          for (let a: number = 0; a < row.index.length; ++a)
            b[row.index[a]!] = b[row.index[a]!]! + (row.coef[a]! * residual) / delta;
        }
      });
      HumanQuadraticSubstitute(upper, s.n, s.band, b, dx);
      let finiteDirection: boolean = true;
      for (let i: number = 0; i < s.n; ++i) {
        if (!Number.isFinite(dx[i]!)) finiteDirection = false;
        xs[i] = xs[i]! + dx[i]!;
        if (!Number.isFinite(xs[i]!)) finiteXS = false;
      }
      active.forEach((r: number, j: number): void => {
        fixed[r] = fixed[r]! + (dot(r, dx, finiteDirection) - r2[j]!) / delta;
      });
    };
    step();

    // Iterative refinement toward the unregularised system.
    for (let pass: number = 0; pass < refine; ++pass) {
      Work.curvature(s, xs, dx);
      for (let i: number = 0; i < s.n; ++i) b[i] = rhs[i]! - dx[i]!;
      active.forEach((r: number): void => {
        subtract(b, r, fixed[r]!);
      });
      active.forEach((r: number, j: number): void => {
        r2[j] = bound[j]! - dot(r, xs, finiteXS);
      });
      step();
    }
    const zs: Float64Array = new Float64Array(s.m);
    const aty: Float64Array = work.transpose;
    aty.fill(0);
    for (let r: number = 0; r < s.m; ++r) {
      let v: number = 0;
      const multiplier: number = fixed[r]!;
      if (finiteXS && Number.isFinite(multiplier)) {
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) {
          const index: number = s.cols[a]!;
          const coefficient: number = s.vals[a]!;
          v += coefficient * xs[index]!;
          aty[index] = aty[index]! + coefficient * multiplier;
        }
      } else {
        const row: ReturnType<typeof HumanQuadraticEntries> = HumanQuadraticEntries(s, r);
        for (let a: number = 0; a < row.index.length; ++a) {
          const index: number = row.index[a]!;
          const coefficient: number = row.coef[a]!;
          v += coefficient * xs[index]!;
          aty[index] = aty[index]! + coefficient * multiplier;
        }
      }
      work.rows[r] = v;
      zs[r] = s.weight[r]! < 0 ? Math.min(s.hi[r]!, Math.max(s.lo[r]!, v)) : v;
    }
    return { x: xs, z: zs, y: fixed, products: work };
  }
}
