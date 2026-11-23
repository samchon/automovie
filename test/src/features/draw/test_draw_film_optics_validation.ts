import { admitAutoMovieFilmOptics } from "@automovie/engine";
import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { AutoMovieFilmResponseStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * A film's optics are admitted at every draw: each out-of-range field throws an
 * error naming the drawn second and the field, and the stage draws nothing for
 * refused optics.
 *
 * Scenarios:
 *
 * 1. Optics with every optional field at a boundary (white balance 1667 and 25000
 *    K, glare 0 and 0.2) are admitted.
 * 2. A non-finite `ev100`, an unknown curve, a white balance of 1666 K, a glare
 *    strength of 0.21, a grade power of 0, a NaN grade slope and a non-finite
 *    saturation each throw a message naming `2.5 s` and the field.
 * 3. The stage handed refused optics throws before any render call.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine's admission and the render stage with each malformed value; an admission that let one through, or named neither the second nor the field, and a stage that drew before refusing, fail.
 * @evidence contracts/development/testing.md#independent-expectations The ranges are the issue's: kelvin within [1667, 25000], glare within [0, 0.2], power above zero, the rest finite.
 * @evidence contracts/development/testing.md#distinguishing-cases Each boundary accepted against its adjacent refused value, one per field. The response arithmetic is owned by the other `test_draw_film_optics_*` units.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_optics_validation`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_optics_validation(): void {
  const base: IAutoMovieFilmOptics = { ev100: 10, toneMapping: "acesFilmic" };
  const grade: IAutoMovieFilmOptics.IGrade = {
    slope: [1, 1, 1],
    offset: [0, 0, 0],
    power: [1, 1, 1],
    saturation: 1,
  };
  const message: (optics: IAutoMovieFilmOptics) => string | null = (
    optics: IAutoMovieFilmOptics,
  ): string | null => {
    try {
      admitAutoMovieFilmOptics(optics, 2.5);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };

  // 1. Boundaries are admitted.
  TestValidator.equals(
    "boundary optics are admitted",
    [
      { ...base, whiteBalance: 1667, glare: { strength: 0 }, grade },
      { ...base, whiteBalance: 25000, glare: { strength: 0.2 } },
    ].map(message),
    [null, null],
  );

  // 2. Each refusal names the second and the field.
  const refused: [IAutoMovieFilmOptics, string][] = [
    [{ ...base, ev100: Number.POSITIVE_INFINITY }, "ev100"],
    [
      {
        ...base,
        toneMapping: "reinhard" as IAutoMovieFilmOptics["toneMapping"],
      },
      "toneMapping",
    ],
    [{ ...base, whiteBalance: 1666 }, "whiteBalance"],
    [{ ...base, glare: { strength: 0.21 } }, "glare.strength"],
    [{ ...base, grade: { ...grade, power: [1, 0, 1] } }, "grade.power[1]"],
    [
      { ...base, grade: { ...grade, slope: [Number.NaN, 1, 1] } },
      "grade.slope[0]",
    ],
    [
      { ...base, grade: { ...grade, saturation: Number.NEGATIVE_INFINITY } },
      "grade.saturation",
    ],
  ];
  TestValidator.predicate(
    "each refusal names the second and the field",
    refused.every(
      ([optics, field]: [IAutoMovieFilmOptics, string]): boolean => {
        const text: string | null = message(optics);
        return text !== null && text.includes("2.5 s") && text.includes(field);
      },
    ),
  );

  // 3. The stage refuses before drawing.
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  let thrown: string = "";
  try {
    stage.draw({
      renderer: double.renderer,
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
      optics: { ...base, glare: { strength: 0.5 } },
      seconds: 2.5,
      width: 16,
      height: 9,
    });
  } catch (error) {
    thrown = error instanceof Error ? error.message : String(error);
  }
  TestValidator.predicate(
    "the stage refuses before any render",
    thrown.includes("glare.strength") && double.renders.length === 0,
  );
  stage.dispose();
}
