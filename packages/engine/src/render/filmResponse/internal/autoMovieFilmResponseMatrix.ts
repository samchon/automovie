import type { IAutoMovieFilmOptics } from "@automovie/interface";

import { AUTOMOVIE_REC709_XYZ } from "../../AUTOMOVIE_REC709_XYZ";
import { autoMoviePlanckianWhite } from "./autoMoviePlanckianWhite";

/*
 * The linear part of a film's camera response, as one row-major 3 × 3 matrix
 * applied to linear Rec. 709 scene values: the exposure scale times the white
 * balance.
 *
 * The exposure scale is `1 / (1.2 × 2^ev100)`, the saturation-based mapping of
 * ISO 12232:2019 with its 78 / (100 × 0.65) factor written as 1.2. With a
 * `whiteBalance`, the matrix also maps the Planckian white of that temperature
 * (autoMoviePlanckianWhite) to the D65 working white by complete von
 * Kries adaptation in the CAT02 cone space (CIE 159:2004): `RGB ← XYZ · CAT02⁻¹
 * · diag(LMS_D65 / LMS_K) · CAT02 · XYZ ← RGB`. Both whites have unit
 * luminance, so a neutral surface keeps its luminance when it is balanced.
 *
 * Exposure and white balance are both linear, and so is the glare that follows
 * them in the final pass, so the final pass applies this one matrix to the
 * scene value and to its glare alike. The caller admits `optics` first; an
 * out-of-range temperature throws from autoMoviePlanckianWhite.
 */
export function autoMovieFilmResponseMatrix(
  optics: Pick<IAutoMovieFilmOptics, "ev100" | "whiteBalance">,
): number[] {
  const scale: number = 1 / (1.2 * 2 ** optics.ev100);
  if (optics.whiteBalance === undefined)
    return [scale, 0, 0, 0, scale, 0, 0, 0, scale];

  // Cone responses of the two whites.
  const source: number[] = multiplyVector(
    multiply(CAT02, AUTOMOVIE_REC709_XYZ.toXyz),
    autoMoviePlanckianWhite(optics.whiteBalance),
  );
  const target: number[] = multiplyVector(CAT02, [
    D65[0] / D65[1],
    1,
    (1 - D65[0] - D65[1]) / D65[1],
  ]);
  const gain: number[] = [
    target[0]! / source[0]!,
    0,
    0,
    0,
    target[1]! / source[1]!,
    0,
    0,
    0,
    target[2]! / source[2]!,
  ];

  // RGB → XYZ → LMS, scale, LMS → XYZ → RGB, then expose.
  const adaptation: number[] = multiply(
    multiply(
      multiply(AUTOMOVIE_REC709_XYZ.fromXyz, invert(CAT02)),
      multiply(gain, CAT02),
    ),
    AUTOMOVIE_REC709_XYZ.toXyz,
  );
  return adaptation.map((value: number): number => value * scale);
}

/*
 * CIE CAT02 cone-response matrix (CIE 159:2004), row-major, from XYZ to the
 * sharpened LMS space the von Kries adaptation scales.
 */
const CAT02: readonly number[] = [
  0.7328, 0.4296, -0.1624, -0.7036, 1.6975, 0.0061, 0.003, 0.0136, 0.9834,
];

/*
 * The D65 working white's chromaticity, (0.3127, 0.3290), as IEC 61966-2-1
 * defines it for the Rec. 709 space.
 */
const D65: readonly [number, number] = [0.3127, 0.329];

/*
 * The row-major product `a · b` of two 3 × 3 matrices.
 */
function multiply(a: readonly number[], b: readonly number[]): number[] {
  const out: number[] = new Array<number>(9).fill(0);
  for (let row: number = 0; row < 3; ++row)
    for (let column: number = 0; column < 3; ++column)
      for (let k: number = 0; k < 3; ++k)
        out[row * 3 + column]! += a[row * 3 + k]! * b[k * 3 + column]!;
  return out;
}

/*
 * The product of a row-major 3 × 3 matrix and a column vector.
 */
function multiplyVector(m: readonly number[], v: readonly number[]): number[] {
  return [0, 1, 2].map(
    (row: number): number =>
      m[row * 3]! * v[0]! + m[row * 3 + 1]! * v[1]! + m[row * 3 + 2]! * v[2]!,
  );
}

/*
 * The inverse of a row-major 3 × 3 matrix by its adjugate, for the invertible
 * CAT02 matrix.
 */
function invert(m: readonly number[]): number[] {
  const a: number = m[0]!;
  const b: number = m[1]!;
  const c: number = m[2]!;
  const d: number = m[3]!;
  const e: number = m[4]!;
  const f: number = m[5]!;
  const g: number = m[6]!;
  const h: number = m[7]!;
  const i: number = m[8]!;
  const cofactor: number[] = [
    e * i - f * h,
    c * h - b * i,
    b * f - c * e,
    f * g - d * i,
    a * i - c * g,
    c * d - a * f,
    d * h - e * g,
    b * g - a * h,
    a * e - b * d,
  ];
  const determinant: number =
    a * cofactor[0]! + b * cofactor[3]! + c * cofactor[6]!;
  return cofactor.map((value: number): number => value / determinant);
}
