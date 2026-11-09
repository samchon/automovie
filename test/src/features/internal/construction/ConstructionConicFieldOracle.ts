/** A scalar value and two derivatives in the test's station coordinate. */
type Scalar = readonly [number, number, number];

/** Radius [value,s,phi,ss,sphi,phiphi], distinct from two source coordinates. */
type Radial = readonly [number, number, number, number, number, number];

/** Full source Hessian [value,s,p,ss,sp,pp]; p is not the polar angle. */
type Source = readonly [number, number, number, number, number, number];

/** Closed polynomial values and source Hessians, without invoking the kernel algebra. */
interface Polynomial {
  /** h=2+s+p squared only through its p coordinate: h=2+s+p*p. */
  value: Source;

  /** Actual derivatives of h*h, supplied directly to a square-root question. */
  square: Source;

  /** Actual derivatives of h*h*h, supplied directly to a cube-root question. */
  cube: Source;
}

/** Independent closed forms used by the isolated native-field question. */
export namespace ConstructionConicFieldOracle {
  /** Implicit ellipse rho=(cos(phi)^2/a^2+sin(phi)^2/b^2)^(-1/2), differentiated directly. */
  export function ellipse(a: Scalar, b: Scalar, phi: number): Radial {
    const c: number = Math.cos(phi);
    const t: number = Math.sin(phi);
    const A: number = 1 / (a[0] * a[0]);
    const B: number = 1 / (b[0] * b[0]);
    const As: number = (-2 * a[1]) / a[0] ** 3;
    const Bs: number = (-2 * b[1]) / b[0] ** 3;
    const Ass: number = (6 * a[1] ** 2) / a[0] ** 4 - (2 * a[2]) / a[0] ** 3;
    const Bss: number = (6 * b[1] ** 2) / b[0] ** 4 - (2 * b[2]) / b[0] ** 3;
    const Q: number = A * c * c + B * t * t;
    const Qs: number = As * c * c + Bs * t * t;
    const Qt: number = 2 * c * t * (B - A);
    const Qss: number = Ass * c * c + Bss * t * t;
    const Qst: number = 2 * c * t * (Bs - As);
    const Qtt: number = 2 * (c * c - t * t) * (B - A);
    const rho: number = Q ** -0.5;
    const first: number = -0.5 * Q ** -1.5;
    const second: number = 0.75 * Q ** -2.5;
    return [
      rho,
      first * Qs,
      first * Qt,
      second * Qs * Qs + first * Qss,
      second * Qs * Qt + first * Qst,
      second * Qt * Qt + first * Qtt,
    ];
  }

  /** A square conic's diagonal rho=a*(1+r)/sqrt(2), with its independent midpoint curvature. */
  export function square(a: Scalar, r: Scalar): Radial {
    return [
      (a[0] * (1 + r[0])) / Math.SQRT2,
      (a[1] * (1 + r[0]) + a[0] * r[1]) / Math.SQRT2,
      0,
      (a[2] * (1 + r[0]) + 2 * a[1] * r[1] + a[0] * r[2]) / Math.SQRT2,
      0,
      (a[0] * (1 + r[0]) * (1 - 2 * r[0] - r[0] * r[0])) /
        (Math.SQRT2 * (1 - r[0])),
    ];
  }

  /** Closed derivatives of h=2+s+p*p and its powers; no AD product or root builds these inputs. */
  export function polynomial(s: number, p: number): Polynomial {
    const h: number = 2 + s + p * p;
    return {
      value: [h, 1, 2 * p, 0, 0, 2],
      square: [h * h, 2 * h, 4 * p * h, 2, 4 * p, 4 * h + 8 * p * p],
      cube: [
        h ** 3,
        3 * h * h,
        6 * p * h * h,
        6 * h,
        12 * p * h,
        6 * h * h + 24 * p * p * h,
      ],
    };
  }
}
