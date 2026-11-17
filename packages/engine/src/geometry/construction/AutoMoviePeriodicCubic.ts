import { adjacentAutoMovieFloat64 as adjacent } from "../../math/adjacentAutoMovieFloat64";

/** One finite closed enclosure in the scalar source's units. */
type Interval = readonly [number, number];

/**
 * The existing periodic cubic's value reader and a local outward range.
 * Preparation and reading retain the original 64 Jacobi sweeps and literal
 * expression. Range conversion encloses that computed reader, not an exact
 * solution of the infinite-precision cyclic equations or tight extrema.
 *
 * @evidence contracts/development/design.md#principled-representation Owns a periodic scalar preparation with radian phase and control-unit values; IPrepared pairs its unchanged value reader with optional finite outward range admission. Finite controls and proof arithmetic remain runtime premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface NaturalSpline.periodic and native rail-range consumers share this one create/IPrepared owner. Only current at and range capabilities are public; interval conversion stays private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled replacement, solver choice, geometric domain or consumer-specific case enters the public representation. Unavailable range proof throws explicitly while value reading retains its existing premises.
 * @evidence contracts/development/common.md#meaningful-documentation States the common preparation, phase/control units, exact-reader versus conservative-range scope and finite-proof limitation; the member declarations give input lifetime and failure ownership.
 */
export namespace AutoMoviePeriodicCubic {
  /**
   * One preparation shared by value reads and optional range admission.
   *
   * @evidence contracts/development/design.md#principled-representation A periodic scalar reader retains its borrowed controls and actual computed curvatures; its range encloses finite-phase values in those same units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface NaturalSpline reads at, while native root admission reads range and at from one preparation. No coefficients, solver options or geometric interpretation are exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Value reading keeps its existing caller premises; only the optional proof capability refuses unavailable finite arithmetic. No sampled range or replacement curve is represented.
   * @evidence contracts/development/common.md#meaningful-documentation States the shared preparation, borrowed immutable controls, phase units and the distinct range failure contract.
   */
  export interface IPrepared {
    /**
     * Existing periodic value at a phase in radians; controls remain unchanged.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the phase unit, the value's control units and that the controls are not changed.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared member slot; `create` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member slot has no body; `create` states the reader's cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member slot retains nothing; `create` states the closure's retention.
     */
    at(psi: number): number;

    /**
     * Finite outward bounds for every finite phase; throws when arithmetic cannot certify them.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what the bounds enclose, their units as the controls' and the thrown failure.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared member slot; `create` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member slot has no body; `create` states the conversion's cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member slot retains nothing; `create` states the closure's retention.
     */
    range(): readonly [number, number];
  }

  /**
   * Prepare the same cyclic curvature solve once for both current consumers.
   * Values contain at least three finite controls and remain unchanged for the
   * reader lifetime. Value reading retains the original caller-owned admission;
   * range validates those premises and its finite proof arithmetic explicitly.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Moves the existing cyclic right-hand sides, 64 Jacobi sweeps, phase reduction and literal Horner expression without changing their arithmetic order. Range reads those same computed curvatures and encloses each literal cubic with an outward Bernstein hull and a separately derived reader-rounding allowance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation owns the unchanged value closure and a lazy range closure; private interval arithmetic serves only their finite enclosure proof.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No root solver, subdivision, fitted coefficients, geometric margin, clamping or second curvature solve is used. Nonfinite proof intermediates refuse instead of inventing a finite bound. The final polynomial coefficient is not replaced by the next control value.
   * @evidence contracts/development/common.md#meaningful-documentation Gives phase/control units, existing value premises, immutable input lifetime, proof scope and explicit range failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation costs O(64m), a value read O(1), and optional range conversion O(m) with fixed work per span and constant temporary storage. No range work runs for a value-only caller.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both capabilities borrow the same controls and solved curvature array; no Jacobi sweep is repeated by a shared preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closures retain the original controls and m curvatures until their caller releases them. Interval temporaries and returned bounds have invocation lifetime; no module cache or process is acquired.
   */
  export function create(values: readonly number[]): IPrepared {
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
      const x: number =
        ((psi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const j: number = Math.min(m - 1, Math.floor(x / h));
      const t: number = x - j * h;
      const [a, b]: [number, number] = [M[j]!, M[(j + 1) % m]!];
      const slope: number = (y(j + 1) - y(j)) / h - (h * (2 * a + b)) / 6;
      return y(j) + t * (slope + t * (a / 2 + (t * (b - a)) / (6 * h)));
    };

    /** Range failure leaves the original value capability unchanged. */
    const range: () => readonly [number, number] = (): readonly [number, number] => {
      try {
        if (m < 3 || !values.every(Number.isFinite) || !M.every(Number.isFinite))
          throw new Error("needs at least three finite controls and curvatures");
        let low: number = Infinity;
        let high: number = -Infinity;
        for (let j: number = 0; j < m; j++) {
          const a: number = M[j]!;
          const b: number = M[(j + 1) % m]!;
          const slope: number = (y(j + 1) - y(j)) / h - (h * (2 * a + b)) / 6;
          const span: Interval = enclose(y(j), slope, a / 2, b - a, 6 * h, cell(j, m, h));
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
  if (!(Number.isFinite(low) && Number.isFinite(high) && low <= high))
    throw new Error("finite ordered enclosure is not representable");
  return [low, high];
}

/** A literal floating value is exact input data for the enclosure proof. */
function point(value: number): Interval {
  return finite(value, value);
}

/** One adjacent value encloses an exact finite sum, including subnormal rounding. */
function add(a: Interval, b: Interval): Interval {
  return finite(adjacent(a[0] + b[0], false), adjacent(a[1] + b[1], true));
}

/** Ordered endpoint subtraction preserves both signs. */
function subtract(a: Interval, b: Interval): Interval {
  return finite(adjacent(a[0] - b[1], false), adjacent(a[1] - b[0], true));
}

/** Four endpoint products cover a bilinear scalar product on its rectangle. */
function multiply(a: Interval, b: Interval): Interval {
  const products: number[] = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
  return finite(adjacent(Math.min(...products), false), adjacent(Math.max(...products), true));
}

/** Positive denominator intervals admit endpoint division without a pole. */
function divide(a: Interval, b: Interval): Interval {
  if (!(b[0] > 0)) throw new Error("enclosure denominator is not positive");
  const quotients: number[] = [a[0] / b[0], a[0] / b[1], a[1] / b[0], a[1] / b[1]];
  return finite(adjacent(Math.min(...quotients), false), adjacent(Math.max(...quotients), true));
}

/**
 * Enclose every rounded t that the existing modulo/divide/floor cell can use.
 * With q=RN(x/h), |q-x/h| <= u|x/h|+eta and 0<=x<2pi.
 * For j<m-1, j<=q<j+1; the clamped last cell only needs q>=j.
 * These inequalities are inverted outward before subtracting the literal
 * RN(j*h). This includes boundary rounding without changing any query.
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
 * Convert the same real cubic backbone on its complete rounded cell.
 * In t=l+w*u its power coefficients are p0, w*p'(l),
 * w^2*(A+3*l*D/H), w^3*D/H. Their Bernstein coefficients are
 * p0, p0+p1/3, p0+2*p1/3+p2/3, and p0+p1+p2+p3.
 * Each conversion operation is outward, so the control hull encloses P.
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
  const p0: Interval = add(point(y), multiply(l, add(point(slope), multiply(l, add(point(a), multiply(l, c))))));
  const p1: Interval = multiply(w, add(point(slope), multiply(l, add(point(2 * a), multiply(point(3), multiply(l, c))))));
  const w2: Interval = multiply(w, w);
  const p2: Interval = multiply(w2, add(point(a), multiply(point(3), multiply(l, c))));
  const p3: Interval = multiply(multiply(w2, w), c);
  const controls: Interval[] = [
    p0,
    add(p0, divide(p1, point(3))),
    add(add(p0, divide(multiply(point(2), p1), point(3))), divide(p2, point(3))),
    add(add(add(p0, p1), p2), p3),
  ];
  const error: number = allowance(y, slope, a, delta, divisor, Math.max(Math.abs(domain[0]), Math.abs(domain[1])));
  return finite(
    adjacent(Math.min(...controls.map((control: Interval): number => control[0])) - error, false),
    adjacent(Math.max(...controls.map((control: Interval): number => control[1])) + error, true),
  );
}

/**
 * Bound the seven remaining rounded operations of the literal value reader.
 * gamma7*Q bounds their relative errors, Q=|y|+T(|s|+T(|A|+T|D|/H)).
 * Every operation also contributes at most eta absolute underflow error.
 * Its downstream weights sum to T^2/H+2*T^2+2*T+2, enlarged by
 * 1/(1-7u). All bound arithmetic is itself outward. Coefficient preparation
 * is not recomputed: y,s,A,D,H are the actual binary64 data of this reader.
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
    multiply(t, add(point(Math.abs(slope)), multiply(t, add(point(Math.abs(a)), divide(multiply(t, point(Math.abs(delta))), point(divisor)))))),
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
