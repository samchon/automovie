import {
  type AutoMovieSolidMeshConstraints,
  AutoMovieSolidMeshPlan,
} from "@automovie/engine";

/**
 * The face planner bridges a periodic band's two winding cycles where they stand closest, whatever their vertex numbering.
 *
 * Fixture: the band `0 < u < 1` of a chart with phase period `2 pi`, bounded by two winding cycles of eight vertices each at the phases `2 pi k / 8`: cycle A at `u = 0` and cycle B at `u = 1`. B's IDs `8..15` start at phase 0; A's IDs `0..7` start at column `offset`, so A's smallest ID stands at phase `2 pi offset / 8`. Each cycle's segments join consecutive IDs, each with the turn that reaches its neighbour's nearest phase image.
 *
 * Scenarios, each at metric phase scales 1 and 40 (length per radian):
 * 1. Offset 4, the smallest IDs half a period apart: the plan exists, has 16 triangles (an annulus of 8 + 8 boundary vertices and no interior point), each of positive chart area and phase span under half a period, and their areas sum to the band's `1 x 2 pi`.
 * 2. Offset 3: the same.
 * 3. Offset 0, the smallest IDs aligned: the same (a control that passes under either bridge rule).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieSolidMeshPlan.triangulate` on a made annulus and reads its triangles' count, chart areas and phase spans. It catches a bridge chosen by vertex-ID order across half a period, after which no ear within half a period exists and the band is refused, and a plan that covers the band twice or leaves part of it; any plan bridging the cycles at a matching phase passes.
 * @evidence contracts/development/testing.md#independent-expectations The count is Euler's for a triangulated annulus without interior vertices (as many triangles as boundary vertices); the area is the band's rectangle in the chart; the half-period span bound is the indexed cover rule the planner documents. None reads the planner's own bridge.
 * @evidence contracts/development/testing.md#distinguishing-cases Misaligned numberings at half a period and at three columns against the aligned control, at two metric scales. Holes, collinear contacts and unequal populations belong to `test_construction_mesh_plan`; the band built by a split node belongs to `test_construction_split`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_mesh_bridge`; it runs the planner in process on made indices and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Offset 4, the smallest IDs half a period apart: the plan exists, has 16 triangles (an annulus of 8 + 8 boundary vertices and no interior...).
 */
export function test_construction_mesh_bridge(): void {
  const failures: string[] = [];
  const period: number = 2 * Math.PI;
  const n: number = 8;
  for (const offset of [4, 3, 0])
    for (const scale of [1, 40]) {
      const label: string = `offset ${offset}, scale ${scale}`;
      const points: Map<number, readonly [number, number]> = new Map();
      for (let k: number = 0; k < n; ++k)
        points.set(k, [0, (period * ((k + offset) % n)) / n]);
      for (let k: number = 0; k < n; ++k)
        points.set(n + k, [1, (period * k) / n]);
      const constraints: AutoMovieSolidMeshConstraints.ISegment[] = [];
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
      const plan: AutoMovieSolidMeshPlan.IPlan | string =
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
        failures.push(`${label}: refused: ${plan.slice(0, 160)}`);
        continue;
      }
      if (plan.triangles.length !== 2 * n)
        failures.push(
          `${label}: ${plan.triangles.length} triangles, expected ${2 * n}`,
        );
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
        if (!(area > 0))
          failures.push(
            `${label}: triangle ${triangle.vertices.join("/")} has chart area ${area}`,
          );
        if (!(span < period / 2))
          failures.push(
            `${label}: triangle ${triangle.vertices.join("/")} spans ${span} rad`,
          );
        total += area;
      }
      if (!(Math.abs(total - period) <= 1e-12 * period))
        failures.push(`${label}: area ${total}, expected ${period}`);
    }
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} bridge failures:\n${failures.join("\n")}`,
    );
}
