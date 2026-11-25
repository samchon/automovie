import { Quaternion, meterAutoMovieIlluminance } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieLight,
  IAutoMovieMeterIlluminance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a few products. */
const ROUNDING: number = 1e-12;

/** White light, luminance weights summing to one. */
const WHITE: IAutoMovieColor = { r: 1, g: 1, b: 1, a: null, hex: null };

/** A light of a type at a place facing a rotation. */
const light: (
  type: "point" | "directional" | "spot",
  intensity: number,
  place: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  color?: IAutoMovieColor,
) => IAutoMovieLight = (
  type: "point" | "directional" | "spot",
  intensity: number,
  place: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  color: IAutoMovieColor = WHITE,
): IAutoMovieLight => {
  const transform: IAutoMovieLight["transform"] = {
    translation: place,
    rotation,
    scale: { x: 1, y: 1, z: 1 },
  };
  return type === "directional"
    ? { id: type, type, transform, color, intensity }
    : type === "point"
      ? { id: type, type, transform, color, intensity, range: 0 }
      : {
          id: type,
          type,
          transform,
          color,
          intensity,
          range: 0,
          coneAngle: 30,
        };
};

/** The illuminance on a surface at the origin facing +Y. */
const lux: (lights: IAutoMovieLight[], point?: IAutoMovieVector3) => number = (
  lights: IAutoMovieLight[],
  point: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
): number =>
  meterAutoMovieIlluminance({ lights, point, normal: { x: 0, y: 1, z: 0 } })
    .lux;

/** Facing straight down, -Y. */
const DOWN: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
  { x: 1, y: 0, z: 0 },
  -90,
);

/**
 * `meterAutoMovieIlluminance` sums the illuminance a set of lights puts on a
 * surface: intensity times luminance (0.2126, 0.7152, 0.0722) times the
 * incidence (inverse square and cosine for a point or spot, cosine alone for a
 * directional light).
 *
 * Scenarios, on a surface at the origin facing +Y:
 *
 * 1. A point light of 100 at (0, 2, 0) gives 100 / 2^2 = 25.
 * 2. The same light at (0, 2, 2) is cos 45 / 8 of 100, and a light below the
 *    surface gives nothing.
 * 3. A directional light facing down, intensity 80, gives 80; a red light of
 *    intensity 100 gives 21.26.
 * 4. A spot facing down with a 30 degree cone gives 25 on its axis and nothing 5 m
 *    to the side.
 * 5. Two lights sum, each reported under its id; a zero normal is refused.
 */
export function test_engine_render_meter_illuminance(): void {
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  TestValidator.predicate(
    "a point light",
    nclose(
      lux([light("point", 100, { x: 0, y: 2, z: 0 }, identity)]),
      25,
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "an oblique and a lower point light",
    nclose(
      lux([light("point", 100, { x: 0, y: 2, z: 2 }, identity)]),
      (100 * Math.SQRT1_2) / 8,
      ROUNDING,
    ) && lux([light("point", 100, { x: 0, y: -2, z: 0 }, identity)]) === 0,
  );
  TestValidator.predicate(
    "directional and coloured",
    nclose(
      lux([light("directional", 80, { x: 0, y: 5, z: 0 }, DOWN)]),
      80,
      ROUNDING,
    ) &&
      nclose(
        lux([
          light("directional", 100, { x: 0, y: 5, z: 0 }, DOWN, {
            r: 1,
            g: 0,
            b: 0,
            a: null,
            hex: null,
          }),
        ]),
        21.26,
        ROUNDING,
      ),
  );
  const spot: IAutoMovieLight = light("spot", 100, { x: 0, y: 2, z: 0 }, DOWN);
  TestValidator.predicate(
    "a spot inside and outside its cone",
    nclose(lux([spot]), 25, ROUNDING) &&
      lux([spot], { x: 5, y: 0, z: 0 }) === 0,
  );
  const both: IAutoMovieMeterIlluminance.IResult = meterAutoMovieIlluminance({
    lights: [
      light("point", 100, { x: 0, y: 2, z: 0 }, identity),
      light("directional", 80, { x: 0, y: 5, z: 0 }, DOWN),
    ],
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
  });
  TestValidator.predicate(
    "the sum and its parts",
    nclose(both.lux, 105, ROUNDING) &&
      both.contributions
        .map((entry: { light: string }): string => entry.light)
        .join() === "point,directional" &&
      both.unmetered.length === 0,
  );
  TestValidator.predicate(
    "a zero normal",
    throwsError(
      (): unknown =>
        meterAutoMovieIlluminance({
          lights: [],
          point: { x: 0, y: 0, z: 0 },
          normal: { x: 0, y: 0, z: 0 },
        }),
      "non-zero",
    ),
  );
}
