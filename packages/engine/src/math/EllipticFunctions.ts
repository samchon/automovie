/**
 * Complete elliptic integrals and the Jacobian elliptic functions of parameter
 * `m = k^2`, as the Cephes Math Library computes them and scipy ships it
 * (`scipy/special/cephes/ellpk.c`, `ellpe.c`, `ellpj.c` at tag v1.11.4,
 * BSD-3-Clause, "Cephes Math Library, Copyright 1984, 1987, 1989, 2000 by
 * Stephen L. Moshier", relicensed for SciPy; scipy's changes "Copyright (c)
 * 2001-2002 Enthought, Inc. 2003-2023, SciPy Developers"). Each is ported line
 * for line: the integrals by the Hastings polynomial approximations with their
 * coefficients, the functions by the arithmetic-geometric mean and its backward
 * recurrence (DLMF 22.20(ii)). Each coefficient is written as the shortest
 * decimal of the double Cephes's longer literal rounds to, the same value the C
 * compiler stores.
 */
export namespace EllipticFunctions {
  /**
   * The complete elliptic integral of the first kind, `K(m)` (`ellpk`, which
   * takes the complementary parameter `m1 = 1 - m`).
   *
   * @param m1 The complementary parameter, `1 - m`.
   * @returns `K`.
   * @throws {Error} For a negative `m1`, outside the domain.
   */
  export function firstKind(m1: number): number {
    if (m1 < 0) throw new Error(`ellpk: m1 ${m1} is negative`);
    if (m1 > 1) {
      return firstKind(1 / m1) / Math.sqrt(m1);
    }
    if (m1 > MACHEP) return polevl(m1, K_P) - Math.log(m1) * polevl(m1, K_Q);
    if (m1 === 0) return Infinity;
    return C1 - 0.5 * Math.log(m1);
  }

  /**
   * The complete elliptic integral of the second kind, `E(m)` (`ellpe`).
   *
   * @param m The parameter.
   * @returns `E`.
   * @throws {Error} For `m` above 1, outside the domain.
   */
  export function secondKind(m: number): number {
    const x: number = 1 - m;
    if (x <= 0) {
      if (x === 0) return 1;
      throw new Error(`ellpe: m ${m} exceeds 1`);
    }
    if (x > 1) return secondKind(1 - 1 / x) * Math.sqrt(x);
    return polevl(x, E_P) - Math.log(x) * (x * polevl(x, E_Q));
  }

  /**
   * The Jacobian elliptic functions `sn`, `cn`, `dn` and the amplitude `phi` of
   * `u` at parameter `m` (`ellpj`).
   *
   * @param u The argument.
   * @param m The parameter, 0 to 1.
   * @returns The four values.
   * @throws {Error} For `m` outside 0 to 1, or an arithmetic-geometric mean
   *   that does not converge in its nine terms (`SF_ERROR_OVERFLOW`).
   */
  export function jacobi(u: number, m: number): IJacobi {
    if (m < 0 || m > 1) throw new Error(`ellpj: m ${m} lies outside 0 to 1`);
    if (m < 1e-9) {
      const t: number = Math.sin(u);
      const b: number = Math.cos(u);
      const ai: number = 0.25 * m * (u - t * b);
      return {
        sn: t - ai * b,
        cn: b + ai * t,
        dn: 1 - 0.5 * m * t * t,
        phi: u - ai,
      };
    }
    if (m >= 0.9999999999) {
      let ai: number = 0.25 * (1 - m);
      const b: number = Math.cosh(u);
      const t: number = Math.tanh(u);
      const phi: number = 1 / b;
      const twon: number = b * Math.sinh(u);
      const sn: number = t + (ai * (twon - u)) / (b * b);
      const ph: number =
        2 * Math.atan(Math.exp(u)) - Math.PI / 2 + (ai * (twon - u)) / b;
      ai *= t * phi;
      return {
        sn,
        cn: phi - ai * (twon - u),
        dn: phi + ai * (twon + u),
        phi: ph,
      };
    }

    // The arithmetic-geometric mean's scale (DLMF 22.20(ii)).
    const a: number[] = [1];
    const c: number[] = [Math.sqrt(m)];
    let b: number = Math.sqrt(1 - m);
    let twon: number = 1;
    let i: number = 0;
    while (Math.abs(c[i]! / a[i]!) > MACHEP) {
      if (i > 7) throw new Error(`ellpj: no convergence at m ${m}`);
      const ai: number = a[i]!;
      ++i;
      c[i] = (ai - b) / 2;
      const t: number = Math.sqrt(ai * b);
      a[i] = (ai + b) / 2;
      b = t;
      twon *= 2;
    }

    // The backward recurrence.
    let phi: number = twon * a[i]! * u;
    let before: number = phi;
    do {
      const t: number = (c[i]! * Math.sin(phi)) / a[i]!;
      before = phi;
      phi = (Math.asin(t) + phi) / 2;
    } while (--i);
    const sn: number = Math.sin(phi);
    const cn: number = Math.cos(phi);
    const dnfac: number = Math.cos(phi - before);
    return {
      sn,
      cn,
      // See the discussion after DLMF 22.20.5.
      dn: Math.abs(dnfac) < 0.1 ? Math.sqrt(1 - m * sn * sn) : cn / dnfac,
      phi,
    };
  }

  /** The Jacobian elliptic functions at one argument. */
  export interface IJacobi {
    /** `sn(u | m)`. */
    sn: number;

    /** `cn(u | m)`. */
    cn: number;

    /** `dn(u | m)`. */
    dn: number;

    /** The amplitude `phi`, radians. */
    phi: number;
  }
}

/*
 * Cephes's machine epsilon, `MACHEP` (2^-53).
 */
const MACHEP: number = Number.EPSILON / 2;

/*
 * `log(4)`, `ellpk`'s `C1`.
 */
const C1: number = 1.3862943611198906;

/*
 * `ellpk`'s numerator coefficients.
 */
const K_P: readonly number[] = [
  0.00013798286460627325, 0.002280257240058756, 0.007974040132204152,
  0.00985821379021226, 0.006874896874499499, 0.006189010336376876,
  0.008790782739527438, 0.014938044891680526, 0.0308851465246712,
  0.09657359028116902, 1.3862943611198906,
];

/*
 * `ellpk`'s logarithm coefficients.
 */
const K_Q: readonly number[] = [
  0.00002940789550485985, 0.0009141847238659173, 0.005940583037531678,
  0.01548505166497624, 0.023908960271592488, 0.030120471522760404,
  0.037377431417382326, 0.04882803475709983, 0.07031249969639575,
  0.12499999999987083, 0.5,
];

/*
 * `ellpe`'s numerator coefficients.
 */
const E_P: readonly number[] = [
  0.0001535525773010133, 0.0025088849216360204, 0.008687868165658896,
  0.010735094905607619, 0.007773954925167871, 0.007583952894135147,
  0.011568843681057412, 0.021831799601555724, 0.05680519456178606,
  0.44314718056099084, 1,
];

/*
 * `ellpe`'s logarithm coefficients.
 */
const E_Q: readonly number[] = [
  0.000032795489857648585, 0.0010096279267935672, 0.006506094899769275,
  0.016886216399331133, 0.026176974245449364, 0.03348339048882249,
  0.04271809265189315, 0.0585936634471101, 0.09374999971976443,
  0.2499999999998883,
];

/*
 * A polynomial by Horner's rule from its leading coefficient (`polevl`,
 * `scipy/special/cephes/polevl.h`).
 */
function polevl(x: number, coefficients: readonly number[]): number {
  let answer: number = coefficients[0]!;
  for (let i: number = 1; i < coefficients.length; i++)
    answer = answer * x + coefficients[i]!;
  return answer;
}
