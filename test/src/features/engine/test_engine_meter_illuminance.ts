import {
  autoMovieIncidentEv100,
  meterAutoMovieIlluminance,
} from "@automovie/engine";
import type {
  IAutoMovieLight,
  IAutoMovieMeterIlluminance,
  IAutoMovieSceneEnvironment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { aimedLight } from "../internal/aimedLight";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Meter the punctual light terms the beauty pass draws, the unitless image
 * lighting, and the incident-light EV100.
 *
 * Scenarios:
 *
 * 1. A directional light of 100000 lux travelling 60 degrees from the reversed
 *    normal meters 50000 lux (cos 60 = 0.5).
 * 2. A 1000 cd point light 2 m away along the normal meters 250 lux with no range,
 *    and 250 × (1 − 0.5⁴)² = 219.73 lux with `range: 4`; beyond its range it
 *    meters 0.
 * 3. A 1000 cd spot 2 m away with `coneAngle: 30`, the normal facing it, meters
 *    250 lux with the point 20 degrees off its axis and 0 lux at 40 degrees.
 * 4. A directional light of 1000 lux coloured (1, 0.5, 0) meters its Rec. 709
 *    luma, 1000 × (0.2126 + 0.5 × 0.7152) = 570.2 lux; a light behind the plane
 *    meters 0; contributions keep the lights' order and ids and sum to the
 *    total.
 * 5. An environment with an image lists `environmentImage` as unmetered with no
 *    value; one with `image: null`, or none, lists nothing.
 * 6. `autoMovieIncidentEv100(100000)` is log2(40000) = 15.288; zero lux is
 *    refused; a zero normal is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported meter and EV100 function on explicit lights and reads totals, per-light contributions and unmetered entries; a wrong cosine sign, a missing range window, a cone measured from the wrong axis, an ignored colour or a dropped image entry changes a value.
 * @evidence contracts/development/testing.md#independent-expectations Values are the issue's hand computations from the cosine law, the inverse square law, the renderer's documented range window and the ISO 2720 meter equation; the luma weights are Rec. 709's.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers each punctual kind inside and outside its reach, a coloured light, a back-facing light, both environment states and the refused inputs. The area panel belongs to test_engine_meter_area_panel and daylight to test_engine_meter_daylight.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name; no GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios with inputs and expected lux.
 */
export function test_engine_meter_illuminance(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const meter: (
    lights: IAutoMovieLight[],
    environment?: IAutoMovieSceneEnvironment | null,
  ) => IAutoMovieMeterIlluminance.IResult = (
    lights: IAutoMovieLight[],
    environment?: IAutoMovieSceneEnvironment | null,
  ): IAutoMovieMeterIlluminance.IResult =>
    meterAutoMovieIlluminance({
      lights,
      point: origin,
      normal: up,
      environment,
    });
  const radians: number = Math.PI / 180;

  // 1. Directional at 60 degrees.
  const sun: IAutoMovieLight = aimedLight({
    id: "sun",
    intensity: 100000,
    position: origin,
    direction: { x: Math.sin(60 * radians), y: -Math.cos(60 * radians), z: 0 },
    kind: { type: "directional" },
  });
  TestValidator.predicate(
    "a directional light at 60 degrees meters half its lux",
    nclose(meter([sun]).lux, 50000, 1e-6),
  );

  // 2. Point light with and without range.
  const point: (range: number, height: number) => IAutoMovieLight = (
    range: number,
    height: number,
  ): IAutoMovieLight =>
    aimedLight({
      id: "lamp",
      intensity: 1000,
      position: { x: 0, y: height, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
      kind: { type: "point", range },
    });
  TestValidator.predicate(
    "a 1000 cd lamp 2 m away meters 250 lux",
    nclose(meter([point(0, 2)]).lux, 250, 1e-9),
  );
  TestValidator.predicate(
    "its range window lowers it to 219.73 lux",
    nclose(meter([point(4, 2)]).lux, 250 * (1 - 0.5 ** 4) ** 2, 1e-9) &&
      nclose(meter([point(4, 2)]).lux, 219.73, 0.01),
  );
  TestValidator.equals(
    "beyond its range it meters nothing",
    meter([point(4, 5)]).lux,
    0,
  );

  // 3. Spot at 20 and 40 degrees off its axis, the point 2 m away along +Y.
  const spot: (offAxis: number) => IAutoMovieLight = (
    offAxis: number,
  ): IAutoMovieLight =>
    aimedLight({
      id: "spot",
      intensity: 1000,
      position: { x: 0, y: 2, z: 0 },
      direction: {
        x: Math.sin(offAxis * radians),
        y: -Math.cos(offAxis * radians),
        z: 0,
      },
      kind: { type: "spot", range: 0, coneAngle: 30 },
    });
  TestValidator.predicate(
    "inside the cone the spot meters as a point light",
    nclose(meter([spot(20)]).lux, 250, 1e-9),
  );
  TestValidator.equals(
    "outside the cone it meters nothing",
    meter([spot(40)]).lux,
    0,
  );

  // 4. Colour, back-facing and order.
  const amber: IAutoMovieLight = aimedLight({
    id: "amber",
    intensity: 1000,
    position: origin,
    direction: { x: 0, y: -1, z: 0 },
    color: { r: 1, g: 0.5, b: 0 },
    kind: { type: "directional" },
  });
  const under: IAutoMovieLight = aimedLight({
    id: "under",
    intensity: 5000,
    position: origin,
    direction: { x: 0, y: 1, z: 0 },
    kind: { type: "directional" },
  });
  const mixed: IAutoMovieMeterIlluminance.IResult = meter([
    amber,
    under,
    point(0, 2),
  ]);
  TestValidator.predicate(
    "a coloured light meters its luma",
    nclose(mixed.contributions[0]!.lux, 1000 * (0.2126 + 0.5 * 0.7152), 1e-9),
  );
  TestValidator.equals(
    "a light behind the plane meters nothing, and the order is the lights'",
    mixed.contributions.map(
      (entry: IAutoMovieMeterIlluminance.IContribution): [string, boolean] => [
        entry.light,
        entry.lux === 0,
      ],
    ),
    [
      ["amber", false],
      ["under", true],
      ["lamp", false],
    ],
  );
  TestValidator.predicate(
    "the total is the sum of the contributions",
    nclose(mixed.lux, 1000 * (0.2126 + 0.5 * 0.7152) + 250, 1e-9),
  );

  // 5. Image lighting.
  const environment: IAutoMovieSceneEnvironment = {
    image: "studio",
    background: null,
    intensity: 1,
    rotationDeg: 0,
    exposure: 1,
    toneMapping: "none",
    shadows: { enabled: false, type: "pcf" },
  };
  TestValidator.equals(
    "an image is unmetered with no value; no image lists nothing",
    [
      meter([sun], environment).unmetered,
      meter([sun], { ...environment, image: null }).unmetered,
      meter([sun], null).unmetered,
      meter([sun]).unmetered,
    ],
    [[{ source: "environmentImage", lux: null }], [], [], []],
  );

  // 6. EV100 and refusals.
  TestValidator.predicate(
    "100000 lux sets EV100 log2(40000)",
    nclose(autoMovieIncidentEv100(100000), Math.log2(40000), 1e-12) &&
      nclose(autoMovieIncidentEv100(100000), 15.288, 1e-3),
  );
  TestValidator.equals(
    "no light and no normal are refused",
    [
      throwsError((): number => autoMovieIncidentEv100(0), "lux"),
      throwsError(
        (): IAutoMovieMeterIlluminance.IResult =>
          meterAutoMovieIlluminance({
            lights: [sun],
            point: origin,
            normal: { x: 0, y: 0, z: 0 },
          }),
        "normal",
      ),
    ],
    [true, true],
  );
}
