/**
 * Closed-form oracles for the view-to-section operator's tests: the centred
 * ellipse in polar form, its exact angle derivatives by truncated Taylor
 * arithmetic, its perimeter by the arithmetic-geometric mean, and the error
 * bound of the quintic-plus-bump quarter that interpolates it.
 *
 * Nothing here reads the operator: every value is a function of the box's
 * half axes, so a test compares the operator's section with these numbers.
 */
export namespace HumanViewOracle {
  /** Taylor coefficients kept, orders 0 to 7: the interpolation bound needs the seventh derivative. */
  export const ORDER: number = 7;

  /**
   * The polar radius of the ellipse `x^2 / a^2 + z^2 / b^2 = 1` about its
   * centre, `a b / sqrt(b^2 cos^2 phi + a^2 sin^2 phi)`, mm.
   */
  export function radius(a: number, b: number, phi: number): number {
    return (a * b) / Math.sqrt((b * Math.cos(phi)) ** 2 + (a * Math.sin(phi)) ** 2);
  }

  /**
   * The ellipse's polar radius and its angle derivatives at `phi`, orders 0 to
   * {@link ORDER}, exact to rounding: the Taylor series of `cos` and `sin`
   * about `phi` (`cos^(k)(phi) = cos(phi + k pi / 2)`), the square-sum
   * `u = b^2 cos^2 + a^2 sin^2` by series products, and `u^(-1/2)` by the
   * power recurrence `f_k = (1 / (k u_0)) sum_j (alpha j - (k - j)) u_j f_(k-j)`
   * with `alpha = -1/2` (Knuth, TAOCP vol. 2, 4.7). Coefficient `k` times
   * `k!` is the `k`-th derivative.
   */
  export function derivatives(a: number, b: number, phi: number): number[] {
    const n: number = ORDER + 1;
    const fact: number[] = [1];
    for (let k: number = 1; k < n; k++) fact.push(fact[k - 1]! * k);
    const cos: number[] = Array.from({ length: n }, (_: unknown, k: number): number => Math.cos(phi + (k * Math.PI) / 2) / fact[k]!);
    const sin: number[] = Array.from({ length: n }, (_: unknown, k: number): number => Math.sin(phi + (k * Math.PI) / 2) / fact[k]!);
    const cc: number[] = product(cos, cos);
    const ss: number[] = product(sin, sin);
    const u: number[] = cc.map((c: number, k: number): number => b * b * c + a * a * ss[k]!);
    const alpha: number = -0.5;
    const f: number[] = [u[0]! ** alpha];
    for (let k: number = 1; k < n; k++) {
      let sum: number = 0;
      for (let j: number = 1; j <= k; j++) sum += (alpha * j - (k - j)) * u[j]! * f[k - j]!;
      f.push(sum / (k * u[0]!));
    }
    return f.map((c: number, k: number): number => a * b * c * fact[k]!);
  }

  /**
   * The largest seventh angle derivative of the ellipse's radius over its
   * first quarter, `[0, pi / 2]`, on `samples` equal steps (the radius is
   * even about both axes, so one quarter holds the whole turn's extremes).
   */
  export function seventh(a: number, b: number, samples: number): number {
    let worst: number = 0;
    for (let i: number = 0; i <= samples; i++) worst = Math.max(worst, Math.abs(derivatives(a, b, (i * Math.PI) / 2 / samples)[ORDER]!));
    return worst;
  }

  /**
   * The error bound of the quarter that interpolates the ellipse from its two
   * guides' radius, slope and curvature and its shoulder point, mm: seven
   * conditions, so by the Hermite remainder the error at share `xi` of the
   * quarter's width `h = pi / 2` is
   * `rho^(7)(zeta) / 7! * h^7 * xi^3 (xi - 1)^3 (xi - xi_s)`, bounded by the
   * largest seventh derivative over the quarter times the largest node
   * polynomial. `xi_s` is the shoulder point's share, `atan2(b, a) / h`.
   * The seventh derivative's maximum is read on 2048 steps, so the bound is
   * itself taken a tenth above it against the sampling, plus the rounding of
   * the radius, 1e-12 of the larger half axis, which alone bounds a circle.
   */
  export function bound(a: number, b: number): number {
    const h: number = Math.PI / 2;
    const xs: number = Math.atan2(b, a) / h;
    let node: number = 0;
    for (let i: number = 0; i <= 4096; i++) {
      const xi: number = i / 4096;
      node = Math.max(node, xi ** 3 * (1 - xi) ** 3 * Math.abs(xi - xs));
    }
    return (1.1 * seventh(a, b, 2048) * h ** 7 * node) / 5040 + 1e-12 * Math.max(a, b);
  }

  /**
   * The ellipse's perimeter, mm, exact to rounding by the
   * arithmetic-geometric mean (Gauss and Ivory): with `a_0 = a`, `b_0 = b`,
   * `c_0^2 = a^2 - b^2` and `c_(n+1) = (a_n - b_n) / 2`,
   * `P = 2 pi (a^2 - sum_n 2^(n-1) c_n^2) / AGM(a, b)` (a circle gives `2 pi a`).
   */
  export function perimeter(a: number, b: number): number {
    let an: number = Math.max(a, b);
    let bn: number = Math.min(a, b);
    let sum: number = 0.5 * (an * an - bn * bn);
    let power: number = 0.5;
    for (let i: number = 0; i < 40 && Math.abs(an - bn) > 1e-15 * an; i++) {
      const c: number = (an - bn) / 2;
      const next: number = (an + bn) / 2;
      bn = Math.sqrt(an * bn);
      an = next;
      power *= 2;
      sum += power * c * c;
    }
    return (2 * Math.PI * (Math.max(a, b) ** 2 - sum)) / an;
  }

  /**
   * The largest weight of a radius change in the length's first variation,
   * `w = rho / s - (rho_phi / s)_phi` with `s = sqrt(rho^2 + rho_phi^2)`:
   * the length of a polar curve moves by `integral w delta_rho dphi` (the
   * slope term integrated by parts round the closed turn), so a radius error
   * of at most `E` moves it by at most `2 pi max|w| E` to first order.
   */
  export function weight(a: number, b: number, samples: number): number {
    let worst: number = 0;
    for (let i: number = 0; i <= samples; i++) {
      const [r, r1, r2]: number[] = derivatives(a, b, (i * Math.PI) / 2 / samples);
      const s: number = Math.hypot(r!, r1!);

      // (r1 / s)' = r2 / s - r1 (r r1 + r1 r2) / s^3.
      const w: number = r! / s - (r2! / s - (r1! * (r! * r1! + r1! * r2!)) / s ** 3);
      worst = Math.max(worst, Math.abs(w));
    }
    return worst;
  }

  /** Product of two truncated Taylor series. */
  function product(p: readonly number[], q: readonly number[]): number[] {
    return p.map((_: number, k: number): number => {
      let sum: number = 0;
      for (let j: number = 0; j <= k; j++) sum += p[j]! * q[k - j]!;
      return sum;
    });
  }
}
