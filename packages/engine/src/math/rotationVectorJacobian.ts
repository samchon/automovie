import type { IAutoMovieVector3 } from "@automovie/interface";

import { determinantAutoMovieMatrix3 } from "./determinantAutoMovieMatrix3";

/**
 * The SO(3) right Jacobian and its inverse for body rotation vectors.
 *
 * Solà et al., A micro Lie theory, equations 68, 143 and 144:
 * https://arxiv.org/pdf/1812.01537. If R=R0 Exp(r), body angular velocity
 * is Jr(r) r'. The inverse is nonsingular before the first 2 pi pole.
 * Stable convergent series follow the sine/cosine Maclaurin series in
 * https://dlmf.nist.gov/4.19.E1 and https://dlmf.nist.gov/4.19.E2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the body-frame convention, radian inputs, differential relation, inverse chart and nullable numerical failures.
 * @evidence contracts/development/design.md#principled-representation Three-component tangent vectors use the right differential of the same exponential as the trajectory; a null result reports an unresolved finite value or the inverse chart's first pole.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Trajectory endpoint slopes consume inverse and dense angular-velocity observation consumes apply; both share one scalar cross implementation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No physical tolerance, small-angle cutoff or changed rotation chart is substituted for the analytic Jacobian.
 */
export namespace rotationVectorJacobian {
  /**
   * Apply Jr(r) to a rotation-vector derivative; return null on overflow.
   *
   * @evidence contracts/development/common.md#meaningful-documentation r is in radians and derivative in radians per second; the result is body angular velocity.
   * @evidence contracts/development/implementation.md#principled-implementation Uses I-a[r]+b[r]^2, a=(1-cos(theta))/theta^2 and b=(theta-sin(theta))/theta^3. Half-angle sine avoids cancellation in a; the convergent alternating series computes b through pi, and its direct formula has no near-zero cancellation above pi.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute scalar coefficients, then apply two cross products without vector temporaries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero uses the exact identity limit. Series stop at floating-point stagnation rather than a guessed angle or physical-error floor.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size vector work plus a rapidly convergent scalar series on the bounded interval zero through pi; above pi direct trigonometry is used.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the scalar cross application with the inverse and uses one half-angle sine ratio for a.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh numeric vector escapes; inputs are not mutated or retained and no cache or handle is acquired.
   */
  export function apply(
    r: IAutoMovieVector3,
    derivative: IAutoMovieVector3,
  ): IAutoMovieVector3 | null {
    const theta: number = Math.hypot(r.x, r.y, r.z);
    if (!Number.isFinite(theta) || !finite(derivative)) return null;
    if (theta === 0 || parallel(r, derivative))
      return { x: derivative.x, y: derivative.y, z: derivative.z };
    const half: number = theta / 2;
    const sinc: number = half === 0 ? 1 : Math.sin(half) / half;
    const square: number = theta * theta;
    let b: number = (1 - Math.sin(theta) / theta) / square;
    if (theta <= Math.PI) {
      b = 1 / 6;
      let term: number = b;
      for (let order: number = 4; ; order += 2) {
        term *= -square / (order * (order + 1));
        const next: number = b + term;
        if (next === b) break;
        b = next;
      }
    }
    return transform(r, derivative, -0.5 * sinc * sinc, b);
  }

  /**
   * Apply Jr(r)^-1 to a body rate within the first nonsingular chart.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The rate is body-frame radians per second. An exact-zero determinant test admits commuting rates even across full turns; a noncommuting inverse outside the first chart or an unrepresentable output returns null. Rounded cross zeros alone never bypass the chart boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Uses I+[r]/2+c[r]^2. Above pi, c=(1-(theta/2)/tan(theta/2))/theta^2 has no subtraction cancellation. Through pi, c=N/sinc(theta/2)^2 with N=sum((-1)^k*2(k+1)*theta^(2k)/(2k+4)!), derived directly from sine and cosine; its alternating terms decrease since the largest first ratio is pi^2/15 below one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the exponential chart, evaluate its stable scalar coefficient and apply the inverse differential.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pi split follows the cotangent sign, not a tuned precision threshold. The convergent series stops at binary64 stagnation; roundoff is not presented as a rigorous interval certificate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size vector work and a convergent scalar series through pi; larger admitted angles use direct cotangent. A rounded-zero cross outside the chart invokes at most three fixed-size exact determinant predicates, whose integer storage is bounded by binary64's exponent range.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same scalar cross application as the forward Jacobian and the existing exact determinant owner for the chart exception; no new integration or shape evaluation is required.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector or null with no input mutation, retained state, cache or external resource.
   */
  export function inverse(
    r: IAutoMovieVector3,
    rate: IAutoMovieVector3,
  ): IAutoMovieVector3 | null {
    const theta: number = Math.hypot(r.x, r.y, r.z);
    if (!Number.isFinite(theta) || !finite(rate)) return null;
    if (theta === 0) return { x: rate.x, y: rate.y, z: rate.z };
    if (parallel(r, rate) && (theta < 2 * Math.PI || commuting(r, rate)))
      return { x: rate.x, y: rate.y, z: rate.z };
    if (!(theta < 2 * Math.PI)) return null;
    const square: number = theta * theta;
    const half: number = theta / 2;
    let c: number = (1 - half / Math.tan(half)) / square;
    if (theta <= Math.PI) {
      let sum: number = 1 / 12;
      let term: number = sum;
      for (let k: number = 0; ; k++) {
        term *= -square * (k + 2) / ((k + 1) * (2 * k + 5) * (2 * k + 6));
        const next: number = sum + term;
        if (next === sum) break;
        sum = next;
      }
      const sinc: number = half === 0 ? 1 : Math.sin(half) / half;
      c = sum / (sinc * sinc);
    }
    return transform(r, rate, 0.5, c);
  }

  /** A rounded-zero cross gives the same zero terms in the finite chart. */
  function parallel(r: IAutoMovieVector3, v: IAutoMovieVector3): boolean {
    return r.y * v.z - r.z * v.y === 0
      && r.z * v.x - r.x * v.z === 0
      && r.x * v.y - r.y * v.x === 0;
  }

  /**
   * Outside the first chart, only an exact zero cross admits an axial rate.
   * The existing determinant owner sums products of the input doubles exactly
   * when cancellation is uncertain. For these finite matrices its only throw
   * is an unrepresentable nonzero magnitude, which also means not commuting.
   */
  function commuting(r: IAutoMovieVector3, v: IAutoMovieVector3): boolean {
    try {
      return determinantAutoMovieMatrix3([r.y, r.z, 0, v.y, v.z, 0, 0, 0, 1]) === 0
        && determinantAutoMovieMatrix3([r.z, r.x, 0, v.z, v.x, 0, 0, 0, 1]) === 0
        && determinantAutoMovieMatrix3([r.x, r.y, 0, v.x, v.y, 0, 0, 0, 1]) === 0;
    } catch {
      return false;
    }
  }

  /** A numerical probe must reject before a physical callback sees invalid rates. */
  function finite(v: IAutoMovieVector3): boolean {
    return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
  }

  /** Apply I+p[r]+q[r]^2 without allocating the two cross products. */
  function transform(
    r: IAutoMovieVector3,
    v: IAutoMovieVector3,
    p: number,
    q: number,
  ): IAutoMovieVector3 | null {
    const ax: number = r.y * v.z - r.z * v.y;
    const ay: number = r.z * v.x - r.x * v.z;
    const az: number = r.x * v.y - r.y * v.x;
    const result: IAutoMovieVector3 = {
      x: v.x + p * ax + q * (r.y * az - r.z * ay),
      y: v.y + p * ay + q * (r.z * ax - r.x * az),
      z: v.z + p * az + q * (r.x * ay - r.y * ax),
    };
    return Number.isFinite(result.x) && Number.isFinite(result.y) && Number.isFinite(result.z)
      ? result
      : null;
  }
}
