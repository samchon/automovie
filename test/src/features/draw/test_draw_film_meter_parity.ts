import {
  autoMovieIncidentEv100,
  meterAutoMovieIlluminance,
  respondAutoMovieFilmColor,
} from "@automovie/engine";
import type { IAutoMovieLight, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { aimedLight } from "../internal/aimedLight";

/**
 * An exposure set from the meter delivers an 18 % grey Lambert card at the same
 * code value under every light kind: the meter and the film response agree on
 * what one lux is.
 *
 * Scenarios:
 *
 * 1. A 1000 cd point light 2 m from the card with `range: 4` (219.7 lux), a 1000
 *    cd spot 20 degrees off its axis (250 lux), a 1 m × 1 m panel of 1000 nits
 *    1 m above (752.2 lux), and a staged 100000 lux sun 30 degrees above the
 *    horizon (50000 lux) each meter their closed-form illuminance.
 * 2. With `ev100` set to `autoMovieIncidentEv100` of that reading and the `"none"`
 *    curve, the card's luminance `0.18 × E / π`, with E the closed form rather
 *    than the reading, encodes to 97 ± 2 of 255 in every channel: 0.1194
 *    linear.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the meter, the EV100 equation and the CPU reference of the final pass in sequence; a meter off by a stop, a wrong meter constant or a response scale that disagrees moves the code value past 97 ± 2.
 * @evidence contracts/development/testing.md#independent-expectations The card's luminance comes from the closed-form illuminance of each case, not from the meter, and 97 is the sRGB encoding of 0.18 × 250 / (100 × 1.2 × π) = 0.1194 computed in the issue.
 * @evidence contracts/development/testing.md#distinguishing-cases Four light kinds at four light levels give one code value. The renderer's own shading of the card is not observed here: the GPU beauty pass of the same scenes is judged by a delivery capture in review, which owns the claim that three.js draws these illuminances.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name; no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios with every light and its expected illuminance.
 */
export function test_draw_film_meter_parity(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const radians: number = Math.PI / 180;
  const k: number = 0.5 / Math.sqrt(1.25);
  const cases: { name: string; light: IAutoMovieLight; lux: number }[] = [
    {
      name: "point",
      light: aimedLight({
        id: "lamp",
        intensity: 1000,
        position: { x: 0, y: 2, z: 0 },
        direction: { x: 0, y: -1, z: 0 },
        kind: { type: "point", range: 4 },
      }),
      lux: 250 * (1 - 0.5 ** 4) ** 2,
    },
    {
      name: "spot",
      light: aimedLight({
        id: "spot",
        intensity: 1000,
        position: { x: 0, y: 2, z: 0 },
        direction: {
          x: Math.sin(20 * radians),
          y: -Math.cos(20 * radians),
          z: 0,
        },
        kind: { type: "spot", range: 0, coneAngle: 30 },
      }),
      lux: 250,
    },
    {
      name: "panel",
      light: aimedLight({
        id: "panel",
        intensity: 1000,
        position: { x: 0, y: 1, z: 0 },
        direction: { x: 0, y: -1, z: 0 },
        kind: { type: "area", width: 1, height: 1 },
      }),
      lux: 1000 * 4 * k * Math.atan(k),
    },
    {
      name: "sun",
      light: aimedLight({
        id: "sun",
        intensity: 100000,
        position: origin,
        direction: {
          x: -Math.cos(30 * radians),
          y: -Math.sin(30 * radians),
          z: 0,
        },
        kind: { type: "directional" },
      }),
      lux: 50000,
    },
  ];
  for (const entry of cases) {
    const metered: number = meterAutoMovieIlluminance({
      lights: [entry.light],
      point: origin,
      normal: up,
    }).lux;
    TestValidator.predicate(
      `${entry.name} meters its closed form`,
      Math.abs(metered - entry.lux) <= 0.001 * entry.lux,
    );
    const card: number = (0.18 * entry.lux) / Math.PI;
    const encoded: [number, number, number] = respondAutoMovieFilmColor({
      color: [card, card, card],
      optics: { ev100: autoMovieIncidentEv100(metered), toneMapping: "none" },
    });
    TestValidator.predicate(
      `${entry.name} delivers the grey card at 97 of 255`,
      encoded.every(
        (value: number): boolean => Math.abs(value * 255 - 97) <= 2,
      ),
    );
  }
}
