import { AutoMovieLoftParameter } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieLoftParameter.phases(rule, polygon)` gives a cyclic polygon's
 * corners phases in [0, 2 pi), the closing edge's crossing allowed to round to
 * the closing knot.
 *
 * Fixture: the diamond (s, e), (0, s), (-s, 0), (0, -s) whose front vertex
 * sits e = sign s epsilon / 16 off its axis (sign -1, 0 or 1), at scales s =
 * 0.001, 1 and 1000, started at each of its four corners.
 *
 * Scenarios:
 *
 * 1. Under the arclength, sagittal and polar rules, every case gives four phases,
 *    each corner at its quarter turn ((i + start) mod 4) pi / 2 within 1e-12
 *    periodically, and leaves every source coordinate unchanged.
 */
export function test_engine_geometry_loft_parameter_phases(): void {
  for (const rule of ["arclength", "sagittal", "polar"] satisfies ("arclength" | "sagittal" | "polar")[])
    for (const scale of [0.001, 1, 1000])
      for (const sign of [-1, 0, 1])
        for (let start: number = 0; start < 4; ++start) {
          const base: [number, number][] = [
            [scale, (sign * scale * Number.EPSILON) / 16],
            [0, scale],
            [-scale, 0],
            [0, -scale],
          ];
          const polygon: [number, number][] = [0, 1, 2, 3].map(
            (i: number): [number, number] => [...base[(i + start) % 4]!],
          );
          const before: string = JSON.stringify(polygon);
          const phases: number[] = AutoMovieLoftParameter.phases(rule, polygon);
          const label: string = `${rule}/${scale}/${sign}/${start}`;
          TestValidator.equals(`${label} count`, phases.length, 4);
          TestValidator.predicate(
            `${label} quarter turns`,
            phases.every((phase: number, i: number): boolean => {
              const expected: number = (((i + start) % 4) * Math.PI) / 2;
              return (
                Math.abs(Math.atan2(Math.sin(phase - expected), Math.cos(phase - expected))) <=
                1e-12
              );
            }),
          );
          TestValidator.equals(`${label} source kept`, JSON.stringify(polygon), before);
        }
}
