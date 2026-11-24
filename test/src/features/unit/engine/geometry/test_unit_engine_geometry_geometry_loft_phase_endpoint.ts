import { AutoMovieLoftParameter } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

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
 */
export function test_unit_engine_geometry_geometry_loft_phase_endpoint(): void {
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
