import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticEntries } from "./HumanQuadraticEntries";
import { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/**
 * The original scaled and unscaled OSQP residuals and normalization values.
 * Prepared zeros may be omitted only while their product operands are
 * finite; exceptional row products restore the actual original sequence.
 *
 * @param s Admitted scaled matrices, current intervals, positive scales and unchanged borrowed or copied original layouts.
 * @param x Current scaled variables, distinct from workspace buffers.
 * @param z Current scaled row values.
 * @param y Current scaled multipliers.
 * @param work Disposable products and borrowed diagnostics for this solve.
 * @param known Immediate polishing products and optional producer-proved x finiteness for these unchanged x/y/A, including exceptional original zero terms when needed.
 * @returns Borrowed diagnostics, overwritten by the next check.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Evaluates Ax-z and Px+q+A-transpose-y infinity norms in scaled and original units, with the existing D/E/c reversal and arithmetic association from Stellato et al. 2020 section 3.4.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns residual measurement separately from Band factorization/polishing; one ordered row pass supplies Ax and A-transpose-y, then the existing curvature owner supplies Px.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every norm, normalization and finite-result decision. Nonfinite operands restore actual zero products in original order rather than hiding them, inventing a NaN or rejecting a genuinely empty row.
 * @evidence contracts/development/implementation.md#efficient-algorithms Normal checks cost O(n+Z+m+n*w), with exact diagonal finite-x curvature reducing n*w to n; supplied products cost O(m+n*w). Exceptional products may visit R original entries and lazily allocate their restored rows.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses unchanged inverse dual scales/q norms and same-call absolute row/dual errors and magnitudes. Positive E and nonnegative 1/(cD) move only sign removal across division/multiplication, preserving exact rounded magnitudes and zero/infinite/NaN results. Immediate polishing products/finite-x proof require unchanged x/y/A; other products recompute with immutable exceptional layouts.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Products and diagnostics belong to the supplied workspace; accepted scalars are copied before reuse, and restored rows release with their one-shot wrapper or fixed model without entering public state or numeric preparation.
 * @evidence contracts/development/common.md#meaningful-documentation Defines residual equations, units, producer-supplied-product premise, IEEE-754 exceptional path, dimensions and borrowed result lifetime.
 */
export function HumanQuadraticResiduals(
  s: B.IScaled,
  x: Float64Array,
  z: Float64Array,
  y: Float64Array,
  work: Work.IWork,
  known?: Pick<Work.IWork, "rows" | "transpose" | "productFiniteX">,
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
  const aty: Float64Array = known === undefined ? work.transpose : known.transpose;
  const finiteX: boolean = known !== undefined || x.every(Number.isFinite);
  if (known === undefined) aty.fill(0);
  for (let r: number = 0; r < s.m; ++r) {
    let ax: number = known === undefined ? 0 : known.rows[r]!;
    if (known === undefined) {
      const multiplier: number = y[r]!;
      if (finiteX && Number.isFinite(multiplier)) {
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
      } else {
        const row: ReturnType<typeof HumanQuadraticEntries> = HumanQuadraticEntries(s, r);
        for (let a: number = 0; a < row.index.length; ++a) {
          const index: number = row.index[a]!;
          const coefficient: number = row.coef[a]!;
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
  Work.curvature(s, x, px, known === undefined ? finiteX : known.productFiniteX);
  for (let i: number = 0; i < s.n; ++i) {
    const unscale: number = s.unscale[i]!;
    const r: number = px[i]! + s.q[i]! + aty[i]!;
    const error: number = Math.abs(r);
    const curvature: number = Math.abs(px[i]!);
    const transpose: number = Math.abs(aty[i]!);
    out.scaledDual = Math.max(out.scaledDual, error);
    out.scaledDualScale = Math.max(out.scaledDualScale, curvature, transpose);
    out.dual = Math.max(out.dual, error * unscale);
    out.dualScale = Math.max(out.dualScale, curvature * unscale, transpose * unscale);
  }
  return out;
}
