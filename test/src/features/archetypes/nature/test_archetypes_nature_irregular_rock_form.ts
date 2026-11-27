import { irregularRockForm } from "@automovie/archetypes/internal";
import { physicalHullFaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Normalize one bounded convex form and intersect its exposed side. */
export function test_archetypes_nature_irregular_rock_form(): void {
  const seed: string = "8b3702c591f41a6d";
  const diameter: number = 0.5;
  const { cell, top, side } = irregularRockForm(seed, diameter);
  const hull = physicalHullFaces(cell.points);
  const tolerance: number = hull.tolerance;
  const bounds = (axis: keyof IAutoMovieVector3): [number, number] => {
    const values = cell.points.map((point): number => point[axis]);
    return [Math.min(...values), Math.max(...values)];
  };
  const [left, right] = bounds("x");
  const [bottom, highest] = bounds("y");
  const [back, front] = bounds("z");
  TestValidator.predicate(
    "the centred X diameter is the longest horizontal separation",
    nclose(left, -diameter / 2, tolerance) &&
      nclose(right, diameter / 2, tolerance) &&
      nclose(back + front, 0, tolerance) &&
      cell.points.every((a) =>
        cell.points.every(
          (b) => Math.hypot(a.x - b.x, a.z - b.z) <= diameter + tolerance,
        ),
      ),
  );
  const base = hull.faces.find(
    (face) => nclose(face.offset, 0, tolerance) && (face.normal.y < -0.99),
  );
  TestValidator.predicate(
    "the rock rests on a flat support facet at Y zero",
    nclose(bottom, 0, tolerance) &&
      base !== undefined &&
      base.loop.length >= 3 &&
      base.loop.every((point) => nclose(point.y, 0, tolerance)),
  );
  const signedDistances = hull.faces.map(
    ({ normal, offset }): number =>
      normal.x * side.x + normal.y * side.y + normal.z * side.z - offset,
  );
  TestValidator.predicate(
    "the upper support and the front half-height ray hit the actual boundary",
    nclose(top.y, highest, tolerance) &&
      nclose(side.x, cell.centroid.x, tolerance) &&
      nclose(side.y, highest / 2, tolerance) &&
      side.z > cell.centroid.z &&
      nclose(Math.max(...signedDistances), 0, tolerance),
  );

  const bigger = irregularRockForm(seed, 2 * diameter);
  const other = irregularRockForm("8b3702c591f41a6e", diameter);
  TestValidator.predicate(
    "doubling diameter scales volume by eight, while the seed changes the form",
    nclose(bigger.cell.volume / cell.volume, 8, 128 * Number.EPSILON) &&
      !nclose(other.top.y, top.y, tolerance),
  );
}
