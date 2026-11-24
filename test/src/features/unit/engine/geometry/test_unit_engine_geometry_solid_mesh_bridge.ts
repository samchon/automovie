import { AutoMovieSolidMeshPlan } from "@automovie/engine";
import type {
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * `AutoMovieSolidMeshPlan.triangulate` bridges a periodic band's two winding
 * cycles where they stand closest, whatever their vertex numbering.
 *
 * Fixture: the band 0 < u < 1 of a chart with phase period 2 pi, bounded by two
 * winding cycles of eight vertices at the phases 2 pi k / 8: cycle A at u = 0
 * (ids 0 to 7, starting at column `offset`) and cycle B at u = 1 (ids 8 to 15,
 * starting at phase 0).
 *
 * Scenarios, for offsets 4, 3 and 0 and metric phase scales 1 and 40:
 *
 * 1. A plan exists with 16 triangles (an annulus of 8 + 8 boundary vertices).
 * 2. Each triangle has positive chart area and a phase span under half a period.
 * 3. The areas sum to the band's 1 x 2 pi.
 */
export function test_unit_engine_geometry_solid_mesh_bridge(): void {
  const period: number = 2 * Math.PI;
  const n: number = 8;
  for (const offset of [4, 3, 0])
    for (const scale of [1, 40]) {
      const label: string = `offset ${offset} scale ${scale}`;
      const points: Map<number, readonly [number, number]> = new Map();
      for (let k: number = 0; k < n; ++k)
        points.set(k, [0, (period * ((k + offset) % n)) / n]);
      for (let k: number = 0; k < n; ++k)
        points.set(n + k, [1, (period * k) / n]);
      const constraints: IAutoMovieSolidMeshConstraints.ISegment[] = [];
      for (const base of [0, n])
        for (let k: number = 0; k < n; ++k) {
          const a: number = base + k;
          const b: number = base + ((k + 1) % n);
          constraints.push({
            a,
            b,
            turn: Math.round((points.get(a)![1] - points.get(b)![1]) / period),
          });
        }
      const plan: IAutoMovieSolidMeshPlan.IPlan | string =
        AutoMovieSolidMeshPlan.triangulate(
          points,
          constraints,
          (u: number): boolean => u > 0 && u < 1,
          period,
          true,
          undefined,
          scale,
        );
      if (typeof plan === "string") {
        TestValidator.equals(`${label} refused`, plan, "");
        continue;
      }
      TestValidator.equals(`${label} triangles`, plan.triangles.length, 2 * n);
      let total: number = 0;
      for (const triangle of plan.triangles) {
        const chart: [number, number][] = triangle.vertices.map(
          (id: number, k: number): [number, number] => [
            points.get(id)![0],
            points.get(id)![1] + triangle.lifts[k]! * period,
          ],
        );
        const [a, b, c]: [number, number][] = chart;
        const area: number =
          ((b![0] - a![0]) * (c![1] - a![1]) -
            (b![1] - a![1]) * (c![0] - a![0])) /
          2;
        const span: number =
          Math.max(a![1], b![1], c![1]) - Math.min(a![1], b![1], c![1]);
        TestValidator.predicate(
          `${label} area ${triangle.vertices.join("/")}`,
          area > 0,
        );
        TestValidator.predicate(
          `${label} span ${triangle.vertices.join("/")}`,
          span < period / 2,
        );
        total += area;
      }
      TestValidator.predicate(
        `${label} total`,
        nclose(total, period, 1e-12 * period),
      );
    }
}
