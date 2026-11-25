import { AutoMovieSolidVector } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieSolidVector` is the solid operators' vector algebra: sums,
 * products, the unit vector, and the 3 x 3, 2 x 2 (Cramer) and general
 * (partially pivoted) linear solves that refuse nearly singular systems.
 *
 * Scenarios:
 *
 * 1. add, sub, scale, combine, dot, cross and norm on (1, 2, 3) and (4, -5, 6):
 *    (5, -3, 9), (-3, 7, -3), (2, 4, 6), (9, -8, 15) for 1 a + 2 b, 12, (27, 6,
 *    -13), sqrt 14; combine of none is 0; unit of (0, 3, 4) is (0, 0.6, 0.8), of
 *    zero null.
 * 2. Columns (2,0,0), (1,3,0), (0,1,4) with b = (5, 7, 8): back substitution of
 *    4 x2 = 8, 3 x1 + x2 = 7, 2 x0 + x1 = 5 gives (5/3, 5/3, 2); coplanar
 *    columns give null.
 * 3. [[2, 1], [1, 3]] x = (3, 5) gives (0.8, 1.4); [[1, 2], [2, 4]] null.
 * 4. A 4 x 4 system whose first pivot is 0 (needs a row swap) is solved to its
 *    known x = (1, -2, 3, 0.5); a dependent system gives null.
 */
export function test_unit_engine_geometry_solid_vector(): void {
  const V = AutoMovieSolidVector;
  const near = (a: readonly number[] | null, b: readonly number[]): boolean =>
    a !== null && a.length === b.length && a.every((x: number, i: number): boolean => Math.abs(x - b[i]!) <= 1e-12);
  const a: [number, number, number] = [1, 2, 3];
  const b: [number, number, number] = [4, -5, 6];

  // 1.
  TestValidator.equals("add", V.add(a, b), [5, -3, 9]);
  TestValidator.equals("sub", V.sub(a, b), [-3, 7, -3]);
  TestValidator.equals("scale", V.scale(a, 2), [2, 4, 6]);
  TestValidator.equals("combine", V.combine([[1, a], [2, b]]), [9, -8, 15]);
  TestValidator.equals("combine none", V.combine([]), [0, 0, 0]);
  TestValidator.equals("dot", V.dot(a, b), 12);
  TestValidator.equals("cross", V.cross(a, b), [27, 6, -13]);
  TestValidator.predicate("norm", Math.abs(V.norm(a) - Math.sqrt(14)) <= 1e-15);
  TestValidator.predicate("unit", near(V.unit([0, 3, 4]), [0, 0.6, 0.8]));
  TestValidator.equals("unit zero", V.unit([0, 0, 0]), null);

  // 2.
  const x = V.solve3([2, 0, 0], [1, 3, 0], [0, 1, 4], [5, 7, 8]);
  TestValidator.predicate("solve3", near(x, [5 / 3, 5 / 3, 2]));
  TestValidator.equals("coplanar", V.solve3([1, 0, 0], [0, 1, 0], [1, 1, 0], [1, 2, 3]), null);

  // 3.
  TestValidator.predicate("solve2", near(V.solve2(2, 1, 1, 3, [3, 5]), [0.8, 1.4]));
  TestValidator.equals("singular 2", V.solve2(1, 2, 2, 4, [1, 2]), null);

  // 4.
  const rows: number[][] = [
    [0, 1, 2, 0],
    [3, 0, 1, 2],
    [1, 1, 1, 1],
    [2, -1, 0, 4],
  ];
  const known: number[] = [1, -2, 3, 0.5];
  const rhs: number[] = rows.map((r: number[]): number => r.reduce((s: number, v: number, j: number): number => s + v * known[j]!, 0));
  TestValidator.predicate("solve", near(V.solve(rows, rhs), known));
  TestValidator.equals("dependent", V.solve([[1, 2, 3, 4], [2, 4, 6, 8], [0, 1, 0, 0], [0, 0, 1, 0]], [1, 2, 3, 4]), null);
}
