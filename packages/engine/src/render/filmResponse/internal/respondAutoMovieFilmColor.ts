import type { IAutoMovieFilmOptics } from "@automovie/interface";

import { autoMovieFilmResponseMatrix } from "./autoMovieFilmResponseMatrix";

/*
 * The CPU reference of a film's camera response for one pixel whose glare is
 * already summed in: the encoded and graded value the final pass writes before
 * quantization.
 *
 * Steps, in the final pass's order without its spatial glare step:
 *
 * 1. Exposure and white balance by autoMovieFilmResponseMatrix;
 * 2. The tone curve: `"none"` passes the value on, and `"acesFilmic"` is the
 *    renderer's fit of the ACES reference rendering and output transforms,
 *    `saturate(Out · RRTAndODT(In · c / 0.6))` with its input and output
 *    matrices and rational fit written out below;
 * 3. Clamping to [0, 1], since the 8-bit output stores nothing outside it and the
 *    encoding is undefined below zero;
 * 4. The sRGB output encoding of IEC 61966-2-1: `12.92 c` up to 0.0031308, else
 *    `1.055 c^(1/2.4) − 0.055`;
 * 5. With a `grade`, the ASC CDL v1.2 operators: `clamp(c × slope + offset, 0,
 *    1)^power` per channel, then `luma + saturation × (c − luma)` with Rec. 709
 *    luma weights (0.2126, 0.7152, 0.0722).
 *
 * The result is not clamped after the grade; the canvas clamps it when it
 * quantizes. `color` is linear Rec. 709 scene light in nits, red, green and
 * blue. The caller admits `optics` first.
 */
export function respondAutoMovieFilmColor(props: {
  /*
   * Linear scene value, nits per channel.
   */
  color: readonly [number, number, number];

  /*
   * The film's optics at the drawn second.
   */
  optics: IAutoMovieFilmOptics;
}): [number, number, number] {
  const m: number[] = autoMovieFilmResponseMatrix(props.optics);
  const [r, g, b]: readonly [number, number, number] = props.color;
  let c: [number, number, number] = [
    m[0]! * r + m[1]! * g + m[2]! * b,
    m[3]! * r + m[4]! * g + m[5]! * b,
    m[6]! * r + m[7]! * g + m[8]! * b,
  ];
  if (props.optics.toneMapping === "acesFilmic") c = acesFilmic(c);
  c = [encode(clamp(c[0])), encode(clamp(c[1])), encode(clamp(c[2]))];
  const grade: IAutoMovieFilmOptics.IGrade | undefined = props.optics.grade;
  if (grade === undefined) return c;
  const graded: number[] = c.map(
    (value: number, k: number): number =>
      clamp(value * channel(grade.slope, k) + channel(grade.offset, k)) **
      channel(grade.power, k),
  );
  const luma: number =
    0.2126 * graded[0]! + 0.7152 * graded[1]! + 0.0722 * graded[2]!;
  return [
    luma + grade.saturation * (graded[0]! - luma),
    luma + grade.saturation * (graded[1]! - luma),
    luma + grade.saturation * (graded[2]! - luma),
  ];
}

/*
 * The renderer's ACES filmic fit at unit renderer exposure, as its shader
 * computes it.
 */
function acesFilmic(
  color: readonly [number, number, number],
): [number, number, number] {
  const v: number[] = color.map((value: number): number => value / 0.6);
  const input: number[] = [
    0.59719 * v[0]! + 0.35458 * v[1]! + 0.04823 * v[2]!,
    0.076 * v[0]! + 0.90834 * v[1]! + 0.01566 * v[2]!,
    0.0284 * v[0]! + 0.13383 * v[1]! + 0.83777 * v[2]!,
  ];
  const fitted: number[] = input.map(
    (x: number): number =>
      (x * (x + 0.0245786) - 0.000090537) /
      (x * (0.983729 * x + 0.432951) + 0.238081),
  );
  return [
    clamp(1.60475 * fitted[0]! - 0.53108 * fitted[1]! - 0.07367 * fitted[2]!),
    clamp(-0.10208 * fitted[0]! + 1.10813 * fitted[1]! - 0.00605 * fitted[2]!),
    clamp(-0.00327 * fitted[0]! - 0.07276 * fitted[1]! + 1.07602 * fitted[2]!),
  ];
}

/*
 * Clamp to [0, 1].
 */
function channel(values: IAutoMovieFilmOptics.IChannels, index: number): number {
  return index === 0 ? values.r : index === 1 ? values.g : values.b;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/*
 * The sRGB transfer function of IEC 61966-2-1 for a value in [0, 1].
 */
function encode(value: number): number {
  return value <= 0.0031308
    ? 12.92 * value
    : 1.055 * value ** (1 / 2.4) - 0.055;
}
