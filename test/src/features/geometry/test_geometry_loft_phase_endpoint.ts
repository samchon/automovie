import { AutoMovieLoftParameter } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * A cyclic polygon's final-edge crossing may round to its exact closing knot.
 *
 * Scenarios:
 *
 * 1. A diamond whose front vertex is Number.EPSILON/16 above its axis makes
 * the last-edge crossing round to the closing endpoint; every phase remains
 * finite and keeps the diamond's geometric quarter-turn correspondence.
 * 2. Exact-axis and equally small below-axis vertices retain their adjacent
 * valid behavior under arclength, sagittal and polar rules.
 * 3. All four cyclic starts and three physical scales preserve each corner's
 * periodic correspondence without mutating any source coordinate.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual engine polygon phase owner on simple closed sections and checks every returned phase and unchanged source point; catches NaN arclength propagation when a fractional last-edge crossing rounds to the exact closing knot, while allowing equivalent phases separated by full turns.
 * @evidence contracts/development/testing.md#independent-expectations A unit diamond has four equal sides and its front/right/back/left corners have periodic phases 0, pi/2, pi and 3pi/2. The authored perturbation is below a double's relative epsilon, so a 1e-12 radian circular tolerance bounds its negligible geometric displacement rather than copying the implementation's interpolation. Physical scaling and cyclic reindexing do not change this geometric correspondence.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rounded closing endpoint, exact knot, adjacent nonclosing crossing, all cyclic starts, positive small/unit/large scales and the unaffected polar rule as well as both anchored rules; full body generation and the actual six-course exterior consumer are owned by the production browser verification.
 * @evidence contracts/development/testing.md#execution-ownership This portable unit imports the numerical owner directly and starts no Human generator, browser, renderer, process or installation; its only runtime work is phase computation over four-point polygons.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A diamond whose front vertex is Number.EPSILON/16 above its axis makes).
 */
export function test_geometry_loft_phase_endpoint(): void {
  const defects: string[] = [];
  for (const rule of ["arclength", "sagittal", "polar"] as const)
    for (const scale of [0.001, 1, 1000])
      for (const sign of [-1, 0, 1])
        for (let start: number = 0; start < 4; ++start) {
          const base: [number, number][] = [
            [scale, (sign * scale * Number.EPSILON) / 16],
            [0, scale],
            [-scale, 0],
            [0, -scale],
          ];
          const polygon: [number, number][] = Array.from(
            { length: 4 },
            (_: unknown, i: number): [number, number] => [
              ...base[(i + start) % 4]!,
            ],
          );
          const phases: number[] = AutoMovieLoftParameter.phases(rule, polygon);
          const label: string = `${rule}/scale=${scale}/side=${sign}/start=${start}`;
          if (phases.length !== 4) defects.push(`${label}: point count`);
          for (let i: number = 0; i < 4; ++i) {
            const actual: number = phases[i]!;
            const expected: number = (((i + start) % 4) * Math.PI) / 2;
            const periodicError: number = Math.atan2(
              Math.sin(actual - expected),
              Math.cos(actual - expected),
            );
            if (!nclose(periodicError, 0, 1e-12))
              defects.push(`${label}: corner ${i} correspondence`);
            if (
              !nclose(polygon[i]![0], base[(i + start) % 4]![0], 0) ||
              !nclose(polygon[i]![1], base[(i + start) % 4]![1], 0)
            )
              defects.push(`${label}: corner ${i} source mutation`);
          }
        }
  TestValidator.equals("finite cyclic knot correspondence", defects, []);
}
