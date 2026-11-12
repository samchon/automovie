/** One finite point in a face's native station/phase chart. */
type Point = readonly [number, number];

/** Exact integer significand multiplied by two to exponent. */
interface Dyadic {
  /** Signed integer significand; zero has no relevant exponent. */
  significand: bigint;

  /** Binary exponent of the integer's least significant bit. */
  exponent: number;
}

/**
 * Exact orientation sign of three represented binary64 chart points.
 *
 * A conservative arithmetic filter accepts a determinant separated from its
 * rounding error. Ambiguous, underflowed or overflowed arithmetic is evaluated
 * as an integer determinant after the six binary64 inputs are placed on one
 * common dyadic grid. This decides the represented points, without a geometric
 * tolerance, coordinate rounding, snapping or new intersection construction.
 *
 * @param a First finite chart point.
 * @param b Second finite chart point.
 * @param c Third finite chart point.
 * @returns +1 for counterclockwise, -1 for clockwise and 0 for exact collinearity.
 * @throws RangeError for a nonfinite input coordinate.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses a binary64 error filter followed by the exact integer determinant of the represented dyadic coordinates; common binary scaling leaves its sign unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One sign predicate owns the arithmetic used by native-chart boundary splitting; dyadic decoding stays private.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance classifies nearby distinct points as equal, and this predicate neither moves coordinates nor merges vertex identities. Exact predicates do not certify a separately rounded intersection construction.
 * @evidence contracts/development/common.md#meaningful-documentation States input finiteness, represented-number semantics, sign convention, exact fallback and invalid-input failure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ordinary separated determinants use constant floating arithmetic, and so does a triple in which a point shares a coordinate with the third, whose sign is one product's read from signs; such triples are the common case on a grid and took the integer path before. Remaining ambiguous cases decode six doubles and use bounded-size integer shifts/products; binary64 exponent range bounds those integers independently of face population.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure predicate coordinates no source evaluations or requests and caches no geometry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One synchronous module-local eight-byte decoding view is retained; integer/tuple scratch is call-local and no input reference survives.
 */
export function orientAutoMovieSolidChart(
  a: Point,
  b: Point,
  c: Point,
): number {
  const ax: number = a[0];
  const ay: number = a[1];
  const bx: number = b[0];
  const by: number = b[1];
  const cx: number = c[0];
  const cy: number = c[1];
  if (
    !(
      Number.isFinite(ax) &&
      Number.isFinite(ay) &&
      Number.isFinite(bx) &&
      Number.isFinite(by) &&
      Number.isFinite(cx) &&
      Number.isFinite(cy)
    )
  )
    throw new RangeError("Chart orientation needs finite coordinates");

  // Axis-aligned constraints need only order comparisons, even at extreme scales.
  if (ax === bx)
    return (by > ay ? 1 : by < ay ? -1 : 0) * (cx > ax ? -1 : cx < ax ? 1 : 0);
  if (ay === by)
    return (bx > ax ? 1 : bx < ax ? -1 : 0) * (cy > ay ? 1 : cy < ay ? -1 : 0);
  const x0: number = ax - cx;
  const y0: number = ay - cy;
  const x1: number = bx - cx;
  const y1: number = by - cy;

  // A point that shares a coordinate with `c` makes one product of the
  // determinant exactly zero: a difference of two finite doubles is zero only
  // when they are equal, and otherwise carries its true sign even when it
  // rounds, underflows to a subnormal or overflows. The determinant's sign is
  // then the other product's, read from signs alone. Points of one grid share
  // coordinates all the time, and without this they all took the integer path.
  if (x0 === 0 || y1 === 0) return 0 - Math.sign(y0) * Math.sign(x1);
  if (y0 === 0 || x1 === 0) return 0 + Math.sign(x0) * Math.sign(y1);
  const left: number = x0 * y1;
  const right: number = y0 * x1;
  const determinant: number = left - right;
  const bound: number = 8 * Number.EPSILON * (Math.abs(left) + Math.abs(right));

  // The filter's relative-error premise excludes subnormal intermediates.
  // Underflowed products take the exact path too, rather than hiding underflow.
  if (
    normal(x0) &&
    normal(y0) &&
    normal(x1) &&
    normal(y1) &&
    normal(left) &&
    normal(right) &&
    Number.isFinite(determinant) &&
    Number.isFinite(bound) &&
    bound > 0 &&
    Math.abs(determinant) > bound
  )
    return determinant > 0 ? 1 : -1;
  const numbers: Dyadic[] = [ax, ay, bx, by, cx, cy].map(decode);
  const nonzero: Dyadic[] = numbers.filter(
    (value: Dyadic): boolean => value.significand !== 0n,
  );
  if (nonzero.length === 0) return 0;
  const exponent: number = Math.min(
    ...nonzero.map((value: Dyadic): number => value.exponent),
  );
  const values: bigint[] = numbers.map((value: Dyadic): bigint =>
    value.significand === 0n
      ? 0n
      : value.significand << BigInt(value.exponent - exponent),
  );
  const exact: bigint =
    (values[2]! - values[0]!) * (values[5]! - values[1]!) -
    (values[3]! - values[1]!) * (values[4]! - values[0]!);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
}

/** Whether a value is finite and of at least the smallest normal magnitude. */
function normal(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) >= NORMAL;
}

/** Decode a finite double without arithmetic on its significand. Calls are synchronous and have no callbacks. */
function decode(value: number): Dyadic {
  VIEW.setFloat64(0, value, false);
  const bits: bigint = VIEW.getBigUint64(0, false);
  const biased: number = Number((bits >> 52n) & 2047n);
  const fraction: bigint = bits & ((1n << 52n) - 1n);
  const unsigned: bigint = biased === 0 ? fraction : fraction + (1n << 52n);
  return {
    significand: bits >> 63n === 0n ? unsigned : -unsigned,
    exponent: biased === 0 ? -1074 : biased - 1075,
  };
}

/** Smallest normal binary64 magnitude; a representation boundary, not a geometry tolerance. */
const NORMAL: number = 2 ** -1022;

/** Fixed decoding storage, never exposed or retained by an input/result. */
const VIEW: DataView = new DataView(new ArrayBuffer(8));
