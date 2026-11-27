import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticCholesky } from "./HumanQuadraticCholesky";
import { HumanQuadraticRow } from "./HumanQuadraticRow";
import { HumanQuadraticSubstitute } from "./HumanQuadraticSubstitute";
import { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/*
 * The solution polished on its active set (section 4): the rows held on a bound
 * (a hard row whose value and multiplier say so, a soft row resting on its
 * bound with its multiplier below its weight) as equalities, a soft row past
 * its bound with its multiplier fixed at its weight, every other row free; the
 * KKT system of those rows, regularised by `δ`, solved in its banded reduced
 * form and refined `refine` times toward the system without it.
 * Parameter s: The scaled problem.
 * Parameter z: The scaled row values.
 * Parameter y: The scaled multipliers.
 * Parameter delta: The regularisation.
 * Parameter refine: The refinement steps.
 * Parameter work: Disposable ADMM buffers after that phase has ended.
 * Returns: Scaled candidate iterates and borrowed products for immediate
 * residual admission before x, y or A changes.
 */
export function HumanQuadraticPolish(
  s: B.IScaled,
  z: Float64Array,
  y: Float64Array,
  delta: number,
  refine: number,
  work: Work.IWork,
): IHumanQuadraticPolishResult {
  const selection: IHumanQuadraticPolishSelection = (work.active ??= {
    rows: [],
    bounds: [],
  });
  const active: number[] = selection.rows;
  const bound: number[] = selection.bounds;
  active.length = 0;
  bound.length = 0;
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
  const retained: Work.IPolish | undefined = work.persistent
    ? work.polish
    : undefined;
  let upper: Work.IFactor;
  if (
    retained !== undefined &&
    retained.p === s.p &&
    Object.is(retained.delta, delta) &&
    retained.active.length === active.length &&
    active.every((r: number, j: number): boolean => r === retained.active[j])
  )
    upper = retained.matrices;
  else {
    const matrices: Work.IFactor = Work.system(s, delta, work);
    const k: Float64Array[] = matrices.system;
    const rowWeight: number = 1 / delta;
    for (const r of active) HumanQuadraticRow(s, k, r, rowWeight);
    upper = HumanQuadraticCholesky(matrices);
    if (work.persistent) {
      const copied: Int32Array =
        retained?.active.length === active.length
          ? retained.active
          : new Int32Array(active.length);
      copied.set(active);
      work.polish = { p: s.p, delta, active: copied, matrices };

      // Keep the factor read-only; only its replaced predecessor may be reset
      // by a later adaptive or polishing system assembly.
      work.matrices = retained?.matrices;
    }
  }

  /*
   * Keep the original subtraction order in both fixed-row right-hand sides.
   */
  const subtract: (out: Float64Array, r: number, multiplier: number) => void = (
    out: Float64Array,
    r: number,
    multiplier: number,
  ): void => {
    const single: number = s.singleton[r]!;
    if (single >= 0)
      out[s.cols[single]!] =
        out[s.cols[single]!]! - s.vals[single]! * multiplier;
    else {
      const end: number = s.start[r + 1]!;
      for (let a: number = s.start[r]!; a < end; ++a)
        out[s.cols[a]!] = out[s.cols[a]!]! - s.vals[a]! * multiplier;
    }
  };

  // The right-hand side: -q̄ less the fixed multipliers' rows.
  const rhs: Float64Array = work.transpose;
  for (let i: number = 0; i < s.n; ++i) rhs[i] = -s.q[i]!;
  for (let r: number = 0; r < s.m; ++r)
    if (fixed[r] !== 0) subtract(rhs, r, fixed[r]!);
  const dot: (r: number, v: Float64Array) => number = (
    r: number,
    v: Float64Array,
  ): number => {
    let out: number = 0;
    const single: number = s.singleton[r]!;
    if (single >= 0) return 0 + s.vals[single]! * v[s.cols[single]!]!;
    const end: number = s.start[r + 1]!;
    for (let a: number = s.start[r]!; a < end; ++a)
      out += s.vals[a]! * v[s.cols[a]!]!;
    return out;
  };

  // The regularised KKT system [P̄ + δI, Āᵀ; Ā, -δI] [Δx; Δy] = [r₁; r₂],
  // reduced: Δy = (Ā Δx - r₂) / δ.
  const xs: Float64Array = new Float64Array(s.n);
  const b: Float64Array = (work.polishRhs ??= new Float64Array(s.n));
  b.set(rhs);
  const r2: Float64Array = work.rows;
  for (let j: number = 0; j < bound.length; ++j) r2[j] = bound[j]!;
  const dx: Float64Array = work.curvature;
  const step: () => void = (): void => {
    active.forEach((r: number, j: number): void => {
      const residual: number = r2[j]!;
      const single: number = s.singleton[r]!;
      if (single >= 0)
        b[s.cols[single]!] =
          b[s.cols[single]!]! + (s.vals[single]! * residual) / delta;
      else {
        const end: number = s.start[r + 1]!;
        for (let a: number = s.start[r]!; a < end; ++a)
          b[s.cols[a]!] = b[s.cols[a]!]! + (s.vals[a]! * residual) / delta;
      }
    });
    HumanQuadraticSubstitute(upper, b, dx);
    for (let i: number = 0; i < s.n; ++i) xs[i] = xs[i]! + dx[i]!;
    active.forEach((r: number, j: number): void => {
      fixed[r] = fixed[r]! + (dot(r, dx) - r2[j]!) / delta;
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
      r2[j] = bound[j]! - dot(r, xs);
    });
    step();
  }
  const zs: Float64Array = new Float64Array(s.m);
  const aty: Float64Array = work.transpose;
  aty.fill(0);
  for (let r: number = 0; r < s.m; ++r) {
    let v: number = 0;
    const multiplier: number = fixed[r]!;
    const single: number = s.singleton[r]!;
    if (single >= 0) {
      const index: number = s.cols[single]!;
      const coefficient: number = s.vals[single]!;
      v += coefficient * xs[index]!;
      aty[index] = aty[index]! + coefficient * multiplier;
    } else {
      const end: number = s.start[r + 1]!;
      for (let a: number = s.start[r]!; a < end; ++a) {
        const index: number = s.cols[a]!;
        const coefficient: number = s.vals[a]!;
        v += coefficient * xs[index]!;
        aty[index] = aty[index]! + coefficient * multiplier;
      }
    }
    work.rows[r] = v;
    zs[r] = s.weight[r]! < 0 ? Math.min(s.hi[r]!, Math.max(s.lo[r]!, v)) : v;
  }
  return { x: xs, z: zs, y: fixed, products: work };
}

/*
 * The record of `IHumanQuadraticPolishSelection`'s site.
 */
type IHumanQuadraticPolishSelection = { rows: number[]; bounds: number[] };

/*
 * The record of `IHumanQuadraticPolishResult`'s site.
 */
type IHumanQuadraticPolishResult = {
  x: Float64Array;
  z: Float64Array;
  y: Float64Array;
  products: Pick<Work.IWork, HumanQuadraticPolishProductsResult>;
};

/*
 * The alternatives of `HumanQuadraticPolishProductsResult`'s site.
 */
type HumanQuadraticPolishProductsResult = "rows" | "transpose";
