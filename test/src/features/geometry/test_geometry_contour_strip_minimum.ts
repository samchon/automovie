import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieContourLoft64 as L } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import { tessellateAutoMovieContourStrip64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourStrip64.ts";
import { contourStripOracle as O } from "../internal/contourStripOracle.ts";
import { nclose } from "../internal/nclose.ts";

/** Strip metadata before its enclosing loft adds a slab address. */
type Observation = Omit<
  NonNullable<L.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;

/**
 * Fixed-seam unsigned-area minimization agrees with exhaustive elementary tilings.
 *
 * Scenarios:
 *
 * 1. Triangle/triangle, triangle/quadrilateral and quadrilateral/pentagon boundaries with a unique exterior seam have all binomially many paths enumerated independently, including paths rejected by sheet incidence.
 * 2. Both windings reverse together, unequal partitions rotate cyclically, and powers-of-two spatial scaling preserve the mathematical problem and its area scale.
 * 3. Repeated calls retain the same triangle identities and leave every input component unchanged.
 * 4. Close, angularly offset convex boundaries allow opposing adjacent face normals while attaining the qualified unsigned-area optimum; this is a contract limit, not a universal crease failure rule.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real strip tessellator and observes emitted input identities, positive-area sheet incidence, deterministic order, input ownership and observer qualification. It catches a wrong recurrence, traceback, tile orientation or lost boundary; legitimate sharp creases remain permitted.
 * @evidence contracts/testing.md#independent-expectations A separate recursive enumeration visits every monotone path and admits complete oriented edge chains and connected vertex links, without reusing the production recurrence. Binomial path counts and quadratic area scaling are analytic. The documented 64-arclength-sample seam is computed by a linear oracle on asymmetric boundaries with a unique exterior, avoiding ill-conditioned symmetric seam ties. This proves small fixed-seam optima, not arbitrary branch embedding or smoothness.
 * @evidence contracts/testing.md#distinguishing-cases Covers smallest area-spanning rings, unequal counts, simultaneous winding reversal, cyclic reindexing, scales 2^-12 through 2^12, exact rebuild and the adjacent-normal counterexample. Degenerate and identity failures belong to strip-topology; shared cubic boundaries and unsupported intervals belong to loft-boundaries.
 * @evidence contracts/testing.md#execution-ownership This named discoverable entry imports portable strip source and a finite mathematical enumerator directly. It installs no consumer, builds no native artifact, starts no process/browser/GPU, replaces no methods and dynamically registers no cases.
 */
export function test_geometry_contour_strip_minimum(): void {
  const cases: [number, number, number, number][] = [
    [3, 3, 1, 20],
    [3, 4, 0.25, 35],
    [4, 5, 0.0001, 126],
  ];
  for (const [n, m, height, count] of cases)
    for (const scale of [2 ** -12, 1, 2 ** 12])
      for (const reversed of [false, true]) {
        // One doubled radius gives the seam a unique exterior independently of
        // roundoff in arclength-centroid accumulation on a regular polygon.
        const a: O.V[] = O.polygon(n, 0, scale).map(
          (p: O.V, i: number): O.V => [p[0] * (i === 0 ? 2 : 1), p[1], p[2]],
        );
        const b: O.V[] = O.polygon(m, height * scale, scale, 0.07);
        if (reversed) {
          a.reverse();
          b.reverse();
        }
        // A cyclic relabelling changes no boundary trace or possible sheet.
        b.push(...b.splice(0, 1));
        const snapshots: number[][] = [...a, ...b].map((p: O.V): number[] => [
          ...p,
        ]);
        const expected: ReturnType<typeof O.minimum> = O.minimum(a, b);
        const unscaled: ReturnType<typeof O.minimum> = O.minimum(
          a.map((p: O.V): O.V => [p[0] / scale, p[1] / scale, p[2] / scale]),
          b.map((p: O.V): O.V => [p[0] / scale, p[1] / scale, p[2] / scale]),
        );
        TestValidator.equals(
          "every elementary path is visited",
          expected.visited,
          count,
        );
        TestValidator.predicate(
          "incidence excludes some paths and admits a finite optimum",
          expected.admitted > 0 &&
            expected.admitted < count &&
            Number.isFinite(expected.area),
        );
        TestValidator.predicate(
          "uniform spatial scale changes area by its square",
          nclose(
            expected.area,
            unscaled.area * scale * scale,
            expected.area * Number.EPSILON * 512 * (n + m),
          ),
        );
        const emitted: O.Triangle[] = [];
        let record:
          | NonNullable<L.IResult["stripObservations"]>[number]
          | undefined;
        tessellateAutoMovieContourStrip64(
          a,
          b,
          (p: O.V, q: O.V, r: O.V): void => {
            emitted.push([p, q, r]);
          },
          undefined,
          (observation: Observation): void => {
            record = {
              beforeMm: 0,
              afterMm: height * scale,
              group: 0,
              ...observation,
            };
          },
        );
        const tolerance: number =
          expected.area * Number.EPSILON * 512 * (n + m);
        TestValidator.predicate(
          "the emitted sheet attains the exhaustive admissible minimum",
          nclose(O.area(emitted), expected.area, tolerance),
        );
        TestValidator.predicate(
          "all boundary segments have the required oriented sheet incidence",
          O.admits(a, b, emitted),
        );
        TestValidator.equals(
          "each step emits one triangle",
          emitted.length,
          n + m,
        );
        TestValidator.predicate(
          "ordinary boundaries are qualified without observational timing",
          record?.qualified === true && record.elapsedMs === null,
        );
        const repeated: O.Triangle[] = [];
        tessellateAutoMovieContourStrip64(
          a,
          b,
          (p: O.V, q: O.V, r: O.V): void => {
            repeated.push([p, q, r]);
          },
        );
        TestValidator.predicate(
          "rebuild preserves the ordered input identities",
          repeated.length === emitted.length &&
            repeated.every((triangle: O.Triangle, i: number): boolean =>
              triangle.every(
                (p: O.V, k: number): boolean => p === emitted[i][k],
              ),
            ),
        );
        TestValidator.predicate(
          "input components retain their exact values",
          [...a, ...b].every((p: O.V, i: number): boolean =>
            p.every((value: number, k: number): boolean =>
              nclose(value, snapshots[i][k], 0),
            ),
          ),
        );
      }

  const a: O.V[] = O.polygon(4, 0),
    b: O.V[] = O.polygon(5, 0.0001, 1, 0.07);
  const triangles: O.Triangle[] = [];
  tessellateAutoMovieContourStrip64(a, b, (p: O.V, q: O.V, r: O.V): void => {
    triangles.push([p, q, r]);
  });
  const opposed: boolean = triangles.some(
    (first: O.Triangle, i: number): boolean =>
      triangles.slice(i + 1).some((second: O.Triangle): boolean => {
        if (first.filter((p: O.V): boolean => second.includes(p)).length !== 2)
          return false;
        const u: O.V = O.normal(first),
          v: O.V = O.normal(second);
        return u[0] * v[0] + u[1] * v[1] + u[2] * v[2] < 0;
      }),
  );
  TestValidator.predicate(
    "unsigned area and valid sheet topology alone allow an adjacent normal reversal",
    opposed && O.admits(a, b, triangles),
  );
}
