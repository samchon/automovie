import type { AutoMovieVector2Tuple } from "@automovie/interface";

/*
 * Exact in-circle sign of a fourth represented binary64 chart point against the
 * circle through three others.
 *
 * The determinant is Lawson's and Guibas–Stolfi's lifted test, `| a-d, |a-d|^2
 * ; b-d, |b-d|^2 ; c-d, |c-d|^2 |`, positive when `d` lies strictly inside the
 * circle through a counter-clockwise `(a, b, c)`. A conservative floating
 * filter (Shewchuk 1997's first-stage bound, here widened to `16 eps` times the
 * permanent) accepts a determinant separated from its rounding error; every
 * other case, including inputs near the underflow range, is evaluated as an
 * integer determinant after the eight inputs are placed on one common dyadic
 * grid. This decides the represented points, without a geometric tolerance,
 * rounding or snapping.
 * Parameter a: First circle point.
 * Parameter b: Second circle point, counter-clockwise after `a`.
 * Parameter c: Third circle point, counter-clockwise after `b`.
 * Parameter d: The point tested.
 * Returns: +1 inside, -1 outside and 0 exactly on the circle; for a clockwise
 * `(a, b, c)` the sign is reversed.
 * RangeError for a nonfinite input coordinate.
 */
export function incircleAutoMovieSolidChart(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  c: Readonly<AutoMovieVector2Tuple>,
  d: Readonly<AutoMovieVector2Tuple>,
): number {
  const values: number[] = [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]];
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
    [adx, ady, bdx, bdy, cdx, cdy].every(
      (value: number): boolean =>
        value === 0 ||
        (Math.abs(value) >= SMALLEST && Math.abs(value) <= LARGEST),
    ) &&
    Math.abs(determinant) > bound
  )
    return determinant > 0 ? 1 : -1;
  const numbers: Dyadic[] = values.map(decode);
  const nonzero: Dyadic[] = numbers.filter(
    (value: Dyadic): boolean => value.significand !== 0n,
  );
  if (nonzero.length === 0) return 0;
  const exponent: number = Math.min(
    ...nonzero.map((value: Dyadic): number => value.exponent),
  );
  const n: bigint[] = numbers.map((value: Dyadic): bigint =>
    value.significand === 0n
      ? 0n
      : value.significand << BigInt(value.exponent - exponent),
  );
  const x: bigint[] = [n[0]! - n[6]!, n[2]! - n[6]!, n[4]! - n[6]!];
  const y: bigint[] = [n[1]! - n[7]!, n[3]! - n[7]!, n[5]! - n[7]!];
  const lift: bigint[] = [0, 1, 2].map(
    (k: number): bigint => x[k]! * x[k]! + y[k]! * y[k]!,
  );
  const exact: bigint =
    lift[0]! * (x[1]! * y[2]! - x[2]! * y[1]!) +
    lift[1]! * (x[2]! * y[0]! - x[0]! * y[2]!) +
    lift[2]! * (x[0]! * y[1]! - x[1]! * y[0]!);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
}

/*
 * Exact integer significand multiplied by two to exponent.
 */
interface Dyadic {
  /*
   * Signed integer significand; zero has no relevant exponent.
   */
  significand: bigint;

  /*
   * Binary exponent of the integer's least significant bit.
   */
  exponent: number;
}

/*
 * Decode a finite double without arithmetic on its significand. Calls are
 * synchronous and have no callbacks.
 */
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

/*
 * Smallest nonzero difference the filter accepts: a fourth power stays above
 * 2^-800, inside the normal range; a representation boundary, not a geometry
 * tolerance.
 */
const SMALLEST: number = 2 ** -200;

/*
 * Largest difference the filter accepts: a fourth power stays below 2^800,
 * inside the finite range.
 */
const LARGEST: number = 2 ** 200;

/*
 * Fixed decoding storage, never exposed or retained by an input/result.
 */
const VIEW: DataView = new DataView(new ArrayBuffer(8));
