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
 * Exact in-circle sign of a fourth represented binary64 chart point against
 * the circle through three others.
 *
 * The determinant is Lawson's and Guibas–Stolfi's lifted test,
 * `| a-d, |a-d|^2 ; b-d, |b-d|^2 ; c-d, |c-d|^2 |`, positive when `d` lies
 * strictly inside the circle through a counter-clockwise `(a, b, c)`. A
 * conservative floating filter (Shewchuk 1997's first-stage bound, here
 * widened to `16 eps` times the permanent) accepts a determinant separated
 * from its rounding error; every other case, including inputs near the
 * underflow range, is evaluated as an integer determinant after the eight
 * inputs are placed on one common dyadic grid. This decides the represented
 * points, without a geometric tolerance, rounding or snapping.
 *
 * @param a First circle point.
 * @param b Second circle point, counter-clockwise after `a`.
 * @param c Third circle point, counter-clockwise after `b`.
 * @param d The point tested.
 * @returns +1 inside, -1 outside and 0 exactly on the circle; for a clockwise `(a, b, c)` the sign is reversed.
 * @throws RangeError for a nonfinite input coordinate.
 *
 * @evidence contracts/common.md#principled-implementation Uses the standard lifted in-circle determinant with a floating error filter and an exact integer fallback on the represented dyadic coordinates; a common binary scale multiplies the determinant by a positive power of two and leaves its sign unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One sign predicate owns the in-circle arithmetic of chart legalization, beside the orientation predicate it pairs with; dyadic decoding stays private.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance classifies nearly cocircular points as on the circle; the predicate moves no coordinate, merges no vertex and never answers from an unfiltered floating value.
 * @evidence contracts/common.md#meaningful-documentation States the determinant, its sign convention for both orientations, the filter's source and bound, the exact fallback and the invalid-input failure.
 * @evidence contracts/performance.md#efficient-algorithms Separated determinants cost constant floating arithmetic; ambiguous ones decode eight doubles and multiply integers whose size the binary64 exponent range bounds, independently of the mesh size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure predicate coordinates no source evaluations or requests and caches no geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one module-local eight-byte decoding view; integer scratch is call-local and no input reference survives.
 */
export function incircleAutoMovieSolidChart(a: Point, b: Point, c: Point, d: Point): number {
  const values: number[] = [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]];
  if (!values.every(Number.isFinite)) throw new RangeError("Chart in-circle needs finite coordinates");
  const adx: number = a[0] - d[0];
  const ady: number = a[1] - d[1];
  const bdx: number = b[0] - d[0];
  const bdy: number = b[1] - d[1];
  const cdx: number = c[0] - d[0];
  const cdy: number = c[1] - d[1];
  const alift: number = adx * adx + ady * ady;
  const blift: number = bdx * bdx + bdy * bdy;
  const clift: number = cdx * cdx + cdy * cdy;
  const bc: number = bdx * cdy - cdx * bdy;
  const ca: number = cdx * ady - adx * cdy;
  const ab: number = adx * bdy - bdx * ady;
  const determinant: number = alift * bc + blift * ca + clift * ab;
  const permanent: number =
    (Math.abs(bdx * cdy) + Math.abs(cdx * bdy)) * alift +
    (Math.abs(cdx * ady) + Math.abs(adx * cdy)) * blift +
    (Math.abs(adx * bdy) + Math.abs(bdx * ady)) * clift;
  const bound: number = 16 * Number.EPSILON * permanent;

  // The filter's relative-error premise needs every product inside the normal
  // range: with each nonzero difference within 2^+-200, no product of four
  // leaves it, and a zero difference is exact. Other inputs take the exact path.
  if (
    [adx, ady, bdx, bdy, cdx, cdy].every((value: number): boolean => value === 0 || (Math.abs(value) >= SMALLEST && Math.abs(value) <= LARGEST)) &&
    Number.isFinite(determinant) &&
    Number.isFinite(bound) &&
    Math.abs(determinant) > bound
  )
    return determinant > 0 ? 1 : -1;
  const numbers: Dyadic[] = values.map(decode);
  const nonzero: Dyadic[] = numbers.filter((value: Dyadic): boolean => value.significand !== 0n);
  if (nonzero.length === 0) return 0;
  const exponent: number = Math.min(...nonzero.map((value: Dyadic): number => value.exponent));
  const n: bigint[] = numbers.map((value: Dyadic): bigint => (value.significand === 0n ? 0n : value.significand << BigInt(value.exponent - exponent)));
  const x: bigint[] = [n[0]! - n[6]!, n[2]! - n[6]!, n[4]! - n[6]!];
  const y: bigint[] = [n[1]! - n[7]!, n[3]! - n[7]!, n[5]! - n[7]!];
  const lift: bigint[] = [0, 1, 2].map((k: number): bigint => x[k]! * x[k]! + y[k]! * y[k]!);
  const exact: bigint =
    lift[0]! * (x[1]! * y[2]! - x[2]! * y[1]!) +
    lift[1]! * (x[2]! * y[0]! - x[0]! * y[2]!) +
    lift[2]! * (x[0]! * y[1]! - x[1]! * y[0]!);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
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

/** Smallest nonzero difference the filter accepts: a fourth power stays above 2^-800, inside the normal range; a representation boundary, not a geometry tolerance. */
const SMALLEST: number = 2 ** -200;

/** Largest difference the filter accepts: a fourth power stays below 2^800, inside the finite range. */
const LARGEST: number = 2 ** 200;

/** Fixed decoding storage, never exposed or retained by an input/result. */
const VIEW: DataView = new DataView(new ArrayBuffer(8));
