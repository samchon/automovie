import type { IAutoMoviePeriodicCubic } from "@automovie/interface";

import { adjacentAutoMovieFloat64 as adjacent } from "../../math/adjacentAutoMovieFloat64";

/** One finite closed enclosure in the scalar source's units. */
type Interval = readonly [number, number];

/**
 * The existing periodic cubic's value reader and a local outward range.
 * Preparation and reading retain the original 64 Jacobi sweeps and literal
 * expression. Range conversion encloses that computed reader, not an exact
 * solution of the infinite-precision cyclic equations or tight extrema.
 */
export namespace AutoMoviePeriodicCubic {
  /**
   * Prepare the same cyclic curvature solve once for both current consumers.
   * Values contain at least three finite controls and remain unchanged for the
   * reader lifetime. Value reading retains the original caller-owned admission;
   * range validates those premises and its finite proof arithmetic explicitly.
   */
  export function create(
    values: readonly number[],
  ): IAutoMoviePeriodicCubic.IPrepared {
    const m: number = values.length;
    const h: number = (2 * Math.PI) / m;
    const y: (j: number) => number = (j: number): number =>
      values[((j % m) + m) % m]!;
    const right: number[] = values.map(
      (_: number, j: number): number =>
        (6 * (y(j + 1) - 2 * y(j) + y(j - 1))) / (h * h),
    );
    let M: number[] = new Array<number>(m).fill(0);
    for (let sweep: number = 0; sweep < 64; ++sweep)
      M = M.map(
        (_: number, j: number): number =>
          (right[j]! - M[(j - 1 + m) % m]! - M[(j + 1) % m]!) / 4,
      );

    /** The original value expression, including its rounded phase cell. */
    const at: (psi: number) => number = (psi: number): number => {
      const x: number = ((psi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const j: number = Math.min(m - 1, Math.floor(x / h));
      const t: number = x - j * h;
      const [a, b]: [number, number] = [M[j]!, M[(j + 1) % m]!];
      const slope: number = (y(j + 1) - y(j)) / h - (h * (2 * a + b)) / 6;
      return y(j) + t * (slope + t * (a / 2 + (t * (b - a)) / (6 * h)));
    };

    /** Range failure leaves the original value capability unchanged. */
    const range: () => readonly [number, number] = (): readonly [
      number,
      number,
    ] => {
      try {
        if (
          m < 3
        )
          throw new Error(
            "needs at least three finite controls and curvatures",
          );
        let low: number = Infinity;
        let high: number = -Infinity;
        for (let j: number = 0; j < m; j++) {
          const a: number = M[j]!;
          const b: number = M[(j + 1) % m]!;
          const slope: number = (y(j + 1) - y(j)) / h - (h * (2 * a + b)) / 6;
          const span: Interval = enclose(
            y(j),
            slope,
            a / 2,
            b - a,
            6 * h,
            cell(j, m, h),
          );
          low = Math.min(low, span[0]);
          high = Math.max(high, span[1]);
        }
        return finite(low, high);
      } catch (error) {
        throw new Error(
          "periodic cubic range unavailable: " +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    };
    return { at, range };
  }
}

/** Refuse an unrepresentable enclosure instead of returning an infinity. */
function finite(low: number, high: number): Interval {
  if (!(low <= high))
    throw new Error("finite ordered enclosure is not representable");
  return [low, high];
}

/** A literal floating value is exact input data for the enclosure proof. */
function point(value: number): Interval {
  return finite(value, value);
}

/**
 * One adjacent value encloses an exact finite sum, including subnormal
 * rounding.
 */
function add(a: Interval, b: Interval): Interval {
  return finite(adjacent(a[0] + b[0], false), adjacent(a[1] + b[1], true));
}

/** Ordered endpoint subtraction preserves both signs. */
function subtract(a: Interval, b: Interval): Interval {
  return finite(adjacent(a[0] - b[1], false), adjacent(a[1] - b[0], true));
}

/** Four endpoint products cover a bilinear scalar product on its rectangle. */
function multiply(a: Interval, b: Interval): Interval {
  const products: number[] = [
    a[0] * b[0],
    a[0] * b[1],
    a[1] * b[0],
    a[1] * b[1],
  ];
  return finite(
    adjacent(Math.min(...products), false),
    adjacent(Math.max(...products), true),
  );
}

/** Positive denominator intervals admit endpoint division without a pole. */
function divide(a: Interval, b: Interval): Interval {
  if (!(b[0] > 0)) throw new Error("enclosure denominator is not positive");
  const quotients: number[] = [
    a[0] / b[0],
    a[0] / b[1],
    a[1] / b[0],
    a[1] / b[1],
  ];
  return finite(
    adjacent(Math.min(...quotients), false),
    adjacent(Math.max(...quotients), true),
  );
}

/**
 * Enclose every rounded t that the existing modulo/divide/floor cell can use.
 * With q=RN(x/h), |q-x/h| <= u|x/h|+eta and 0<=x<2pi. For j<m-1, j<=q<j+1; the
 * clamped last cell only needs q>=j. These inequalities are inverted outward
 * before subtracting the literal RN(j*h). This includes boundary rounding
 * without changing any query.
 */
function cell(j: number, m: number, h: number): Interval {
  const u: Interval = point(Number.EPSILON / 2);
  const eta: Interval = point(Number.MIN_VALUE);
  const lower: Interval = divide(
    multiply(point(h), subtract(point(j), eta)),
    add(point(1), u),
  );
  const upper: Interval = divide(
    multiply(point(h), add(point(j + 1), eta)),
    subtract(point(1), u),
  );
  const x: Interval = finite(
    Math.max(0, lower[0]),
    j === m - 1 ? 2 * Math.PI : Math.min(2 * Math.PI, upper[1]),
  );
  return subtract(x, point(j * h));
}

/**
 * Convert the same real cubic backbone on its complete rounded cell. In t=l+w_u
 * its power coefficients are p0, w_p'(l), w^2*(A+3_l_D/H), w^3_D/H. Their
 * Bernstein coefficients are p0, p0+p1/3, p0+2_p1/3+p2/3, and p0+p1+p2+p3. Each
 * conversion operation is outward, so the control hull encloses P.
 */
function enclose(
  y: number,
  slope: number,
  a: number,
  delta: number,
  divisor: number,
  domain: Interval,
): Interval {
  for (const value of [y, slope, a, delta, divisor]) point(value);
  if (!(divisor > 0)) throw new Error("literal cubic divisor is not positive");

  // This is a literal constant expression, not an assumed flat control net.
  if (slope === 0 && a === 0 && delta === 0) return point(y);
  const l: Interval = point(domain[0]);
  const w: Interval = subtract(point(domain[1]), l);
  const c: Interval = divide(point(delta), point(divisor));
  const p0: Interval = add(
    point(y),
    multiply(l, add(point(slope), multiply(l, add(point(a), multiply(l, c))))),
  );
  const p1: Interval = multiply(
    w,
    add(
      point(slope),
      multiply(l, add(point(2 * a), multiply(point(3), multiply(l, c)))),
    ),
  );
  const w2: Interval = multiply(w, w);
  const p2: Interval = multiply(
    w2,
    add(point(a), multiply(point(3), multiply(l, c))),
  );
  const p3: Interval = multiply(multiply(w2, w), c);
  const controls: Interval[] = [
    p0,
    add(p0, divide(p1, point(3))),
    add(
      add(p0, divide(multiply(point(2), p1), point(3))),
      divide(p2, point(3)),
    ),
    add(add(add(p0, p1), p2), p3),
  ];
  const error: number = allowance(
    y,
    slope,
    a,
    delta,
    divisor,
    Math.max(Math.abs(domain[0]), Math.abs(domain[1])),
  );
  return finite(
    adjacent(
      Math.min(...controls.map((control: Interval): number => control[0])) -
        error,
      false,
    ),
    adjacent(
      Math.max(...controls.map((control: Interval): number => control[1])) +
        error,
      true,
    ),
  );
}

/**
 * Bound the seven remaining rounded operations of the literal value reader.
 * gamma7_Q bounds their relative errors, Q=|y|+T(|s|+T(|A|+T|D|/H)). Every
 * operation also contributes at most eta absolute underflow error. Its
 * downstream weights sum to T^2/H+2_T^2+2*T+2, enlarged by 1/(1-7u). All bound
 * arithmetic is itself outward. Coefficient preparation is not recomputed:
 * y,s,A,D,H are the actual binary64 data of this reader.
 */
function allowance(
  y: number,
  slope: number,
  a: number,
  delta: number,
  divisor: number,
  extent: number,
): number {
  const t: Interval = point(extent);
  const t2: Interval = multiply(t, t);
  const denominator: Interval = point(1 - 7 * (Number.EPSILON / 2));
  const gamma: Interval = divide(point(7 * (Number.EPSILON / 2)), denominator);
  const q: Interval = add(
    point(Math.abs(y)),
    multiply(
      t,
      add(
        point(Math.abs(slope)),
        multiply(
          t,
          add(
            point(Math.abs(a)),
            divide(multiply(t, point(Math.abs(delta))), point(divisor)),
          ),
        ),
      ),
    ),
  );
  const weight: Interval = add(
    add(divide(t2, point(divisor)), multiply(point(2), t2)),
    add(multiply(point(2), t), point(2)),
  );
  return add(
    multiply(gamma, q),
    divide(multiply(point(Number.MIN_VALUE), weight), denominator),
  )[1];
}
