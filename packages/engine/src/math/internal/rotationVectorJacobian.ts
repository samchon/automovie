import type { IAutoMovieVector3 } from "@automovie/interface";

import { determinantMatrix3 } from "./determinantMatrix3";

/*
 * The SO(3) right Jacobian and its inverse for body rotation vectors.
 *
 * Solà et al., A micro Lie theory, equations 68, 143 and 144:
 * https://arxiv.org/pdf/1812.01537. If R=R0 Exp(r), body angular velocity is
 * Jr(r) r'. The inverse is nonsingular before the first 2 pi pole. Stable
 * convergent series follow the sine/cosine Maclaurin series in
 * https://dlmf.nist.gov/4.19.E1 and https://dlmf.nist.gov/4.19.E2.
 */
export namespace rotationVectorJacobian {
  /*
   * Apply Jr(r) to a rotation-vector derivative; return null on overflow.
   */
  export function apply(
    r: IAutoMovieVector3,
    derivative: IAutoMovieVector3,
  ): IAutoMovieVector3 | null {
    const theta: number = Math.hypot(r.x, r.y, r.z);
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

  /*
   * Apply Jr(r)^-1 to a body rate within the first nonsingular chart.
   */
  export function inverse(
    r: IAutoMovieVector3,
    rate: IAutoMovieVector3,
  ): IAutoMovieVector3 | null {
    const theta: number = Math.hypot(r.x, r.y, r.z);
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
        term *= (-square * (k + 2)) / ((k + 1) * (2 * k + 5) * (2 * k + 6));
        const next: number = sum + term;
        if (next === sum) break;
        sum = next;
      }
      const sinc: number = half === 0 ? 1 : Math.sin(half) / half;
      c = sum / (sinc * sinc);
    }
    return transform(r, rate, 0.5, c);
  }

  /*
   * A rounded-zero cross gives the same zero terms in the finite chart.
   */
  function parallel(r: IAutoMovieVector3, v: IAutoMovieVector3): boolean {
    return (
      r.y * v.z - r.z * v.y === 0 &&
      r.z * v.x - r.x * v.z === 0 &&
      r.x * v.y - r.y * v.x === 0
    );
  }

  /*
   * Outside the first chart, only an exact zero cross admits an axial rate. The
   * existing determinant owner sums products of the input doubles exactly when
   * cancellation is uncertain. For these finite matrices its only throw is an
   * unrepresentable nonzero magnitude, which also means not commuting.
   */
  function commuting(r: IAutoMovieVector3, v: IAutoMovieVector3): boolean {
    try {
      return (
        determinantMatrix3([r.y, r.z, 0, v.y, v.z, 0, 0, 0, 1]) ===
          0 &&
        determinantMatrix3([r.z, r.x, 0, v.z, v.x, 0, 0, 0, 1]) ===
          0 &&
        determinantMatrix3([r.x, r.y, 0, v.x, v.y, 0, 0, 0, 1]) === 0
      );
    } catch {
      return false;
    }
  }

  /*
   * Apply I+p[r]+q[r]^2 without allocating the two cross products.
   */
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
    return result;
  }
}
