import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/**
 * The original scaled and unscaled OSQP residuals and normalization values.
 *
 * @param s Admitted scaled matrices, current intervals, positive scales and
 *   unchanged borrowed or copied original layouts.
 * @param x Current scaled variables, distinct from workspace buffers.
 * @param z Current scaled row values.
 * @param y Current scaled multipliers.
 * @param work Disposable products and borrowed diagnostics for this solve.
 * @param known Immediate polishing products for these unchanged x/y/A.
 * @returns Borrowed diagnostics, overwritten by the next check.
 */
export function HumanQuadraticResiduals(
  s: B.IScaled,
  x: Float64Array,
  z: Float64Array,
  y: Float64Array,
  work: Work.IWork,
  known?: Pick<Work.IWork, HumanQuadraticResidualsKnown>,
): B.IResiduals {
  const out: B.IResiduals = work.residuals;
  out.primal = 0;
  out.primalScale = 0;
  out.dual = 0;
  out.dualScale = s.unscaledQNorm;
  out.scaledPrimal = 0;
  out.scaledPrimalScale = 0;
  out.scaledDual = 0;
  out.scaledDualScale = s.qNorm;
  const aty: Float64Array =
    known === undefined ? work.transpose : known.transpose;
  if (known === undefined) aty.fill(0);
  for (let r: number = 0; r < s.m; ++r) {
    let ax: number = known === undefined ? 0 : known.rows[r]!;
    if (known === undefined) {
      const multiplier: number = y[r]!;
      const single: number = s.singleton[r]!;
      if (single >= 0) {
        const index: number = s.cols[single]!;
        const coefficient: number = s.vals[single]!;
        ax += coefficient * x[index]!;
        aty[index] = aty[index]! + coefficient * multiplier;
      } else {
        const end: number = s.start[r + 1]!;
        for (let a: number = s.start[r]!; a < end; ++a) {
          const index: number = s.cols[a]!;
          const coefficient: number = s.vals[a]!;
          ax += coefficient * x[index]!;
          aty[index] = aty[index]! + coefficient * multiplier;
        }
      }
    }
    const e: number = s.e[r]!;
    const error: number = Math.abs(ax - z[r]!);
    const magnitude: number = Math.abs(ax);
    const split: number = Math.abs(z[r]!);
    out.scaledPrimal = Math.max(out.scaledPrimal, error);
    out.scaledPrimalScale = Math.max(out.scaledPrimalScale, magnitude, split);
    out.primal = Math.max(out.primal, error / e);
    out.primalScale = Math.max(out.primalScale, magnitude / e, split / e);
  }
  const px: Float64Array = work.curvature;
  Work.curvature(s, x, px);
  for (let i: number = 0; i < s.n; ++i) {
    const unscale: number = s.unscale[i]!;
    const r: number = px[i]! + s.q[i]! + aty[i]!;
    const error: number = Math.abs(r);
    const curvature: number = Math.abs(px[i]!);
    const transpose: number = Math.abs(aty[i]!);
    out.scaledDual = Math.max(out.scaledDual, error);
    out.scaledDualScale = Math.max(out.scaledDualScale, curvature, transpose);
    out.dual = Math.max(out.dual, error * unscale);
    out.dualScale = Math.max(
      out.dualScale,
      curvature * unscale,
      transpose * unscale,
    );
  }
  return out;
}

/** The alternatives of `HumanQuadraticResidualsKnown`'s site. */
type HumanQuadraticResidualsKnown = "rows" | "transpose";
