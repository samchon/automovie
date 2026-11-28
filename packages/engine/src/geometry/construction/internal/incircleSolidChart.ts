import type { AutoMovieVector2Tuple } from "@automovie/interface";

import { finiteBinary64Grid } from "../../../math/internal/finiteBinary64Grid";

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
export function incircleSolidChart(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  c: Readonly<AutoMovieVector2Tuple>,
  d: Readonly<AutoMovieVector2Tuple>,
): number {
  const values = [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]] as const;
  if (!values.every(Number.isFinite))
    throw new RangeError("Solid chart coordinates must be finite");
  const [ax, ay, bx, by, cx, cy, dx, dy] = values;
  const adx: number = ax - dx;
  const ady: number = ay - dy;
  const bdx: number = bx - dx;
  const bdy: number = by - dy;
  const cdx: number = cx - dx;
  const cdy: number = cy - dy;
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
  const n: bigint[] = finiteBinary64Grid(values);
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
