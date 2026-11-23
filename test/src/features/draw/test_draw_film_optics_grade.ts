import { respondAutoMovieFilmColor } from "@automovie/engine";
import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The grade applies the ASC CDL v1.2 operators to encoded values, and the
 * identity grade draws the same picture as no grade.
 *
 * Scenarios:
 *
 * 1. With slope (1.2, 1.0, 0.8), zero offset, unit power and saturation 1, an
 *    encoded grey of 0.5 becomes (0.6, 0.5, 0.4) within 1/255.
 * 2. Saturation 0 then turns (0.6, 0.5, 0.4) into the Rec. 709 luma 0.2126 × 0.6 +
 *    0.7152 × 0.5 + 0.0722 × 0.4 = 0.5141 in every channel.
 * 3. Over 256 greys and 64 colours from black to beyond white, the identity grade
 *    (slope 1, offset 0, power 1, saturation 1) quantizes to the same bytes as
 *    no grade.
 * 4. An offset that lifts black lifts an encoded zero by that offset, and a power
 *    of 2 squares the clamped value.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the engine's CPU reference of the response, which the final pass mirrors, with chosen grades; a grade applied before encoding, without clamping, in another order or about another luma fails.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the decision list's formula on the issue's numbers, with the linear input chosen as the sRGB decoding of 0.5 at unit exposure scale, so the encoded value entering the grade is 0.5 by IEC 61966-2-1.
 * @evidence contracts/development/testing.md#distinguishing-cases Slope, saturation, offset and power each alone, and the identity against absence. Range refusals are owned by `test_draw_film_optics_validation`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_optics_grade`; it runs CPU arithmetic only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_optics_grade(): void {
  // Unit exposure scale: 1 / (1.2 × 2^ev100) = 1.
  const base: IAutoMovieFilmOptics = {
    ev100: Math.log2(1 / 1.2),
    toneMapping: "none",
  };
  const grey: number = ((0.5 + 0.055) / 1.055) ** 2.4;
  const grade: (
    grade: IAutoMovieFilmOptics.IGrade,
    value?: number,
  ) => [number, number, number] = (
    grade: IAutoMovieFilmOptics.IGrade,
    value: number = grey,
  ): [number, number, number] =>
    respondAutoMovieFilmColor({
      color: [value, value, value],
      optics: { ...base, grade },
    });

  // 1. Slope.
  const sloped: [number, number, number] = grade({
    slope: [1.2, 1, 0.8],
    offset: [0, 0, 0],
    power: [1, 1, 1],
    saturation: 1,
  });
  TestValidator.predicate(
    "slope gives (0.6, 0.5, 0.4)",
    [0.6, 0.5, 0.4].every((expected: number, k: number): boolean =>
      nclose(sloped[k]!, expected, 1 / 255),
    ),
  );

  // 2. Saturation zero.
  const grey709: [number, number, number] = grade({
    slope: [1.2, 1, 0.8],
    offset: [0, 0, 0],
    power: [1, 1, 1],
    saturation: 0,
  });
  TestValidator.predicate(
    "saturation 0 gives luma 0.5141",
    grey709.every((value: number): boolean => nclose(value, 0.5141, 1 / 255)),
  );

  // 3. Identity against absence.
  const identity: IAutoMovieFilmOptics.IGrade = {
    slope: [1, 1, 1],
    offset: [0, 0, 0],
    power: [1, 1, 1],
    saturation: 1,
  };
  const bytes: (color: readonly number[]) => number[] = (
    color: readonly number[],
  ): number[] =>
    color.map((value: number): number =>
      Math.round(Math.min(1, Math.max(0, value)) * 255),
    );
  const inputs: [number, number, number][] = [
    ...Array.from(
      { length: 256 },
      (_: unknown, i: number): [number, number, number] => [
        (i / 255) ** 2.2 * 1.5,
        (i / 255) ** 2.2 * 1.5,
        (i / 255) ** 2.2 * 1.5,
      ],
    ),
    ...Array.from(
      { length: 64 },
      (_: unknown, i: number): [number, number, number] => [
        ((i * 37) % 64) / 50,
        ((i * 11) % 64) / 50,
        i / 50,
      ],
    ),
  ];
  TestValidator.predicate(
    "the identity grade quantizes as no grade",
    inputs.every((color: [number, number, number]): boolean => {
      const plain: number[] = bytes(
        respondAutoMovieFilmColor({ color, optics: base }),
      );
      const graded: number[] = bytes(
        respondAutoMovieFilmColor({
          color,
          optics: { ...base, grade: identity },
        }),
      );
      return plain.every(
        (value: number, k: number): boolean => value === graded[k],
      );
    }),
  );

  // 4. Offset and power.
  TestValidator.predicate(
    "offset lifts black and power squares",
    grade({ ...identity, offset: [0.1, 0.1, 0.1] }, 0).every(
      (value: number): boolean => nclose(value, 0.1, 1e-12),
    ) &&
      grade({ ...identity, power: [2, 2, 2] }).every((value: number): boolean =>
        nclose(value, 0.25, 1e-9),
      ),
  );
}
