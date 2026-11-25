import { physicalPlanarPolygon as Polygon } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The planar polygon helpers keep Euclid's `ConvexPolygon2D` semantics the
 * ported balance modules rely on: clockwise vertices, the empty polygon's area
 * not a number, the area centroid, the line-of-sight order, a boundary point
 * inside, IHMC's shrink and inequality rows, and a frame whose y is left of
 * forward.
 *
 * Scenarios:
 *
 * 1. The hull of a 2 x 1 rectangle's corners, shuffled with a duplicate and an
 *    edge midpoint, is its four corners, clockwise (negative shoelace).
 * 2. Areas: the rectangle 2, a trapezoid 3, a point 0, nothing 0; the trapezoid's
 *    centroid is its area centroid, not its vertices' mean.
 * 3. From (3, 0) the unit square's visible vertices are (1, -1) then (1, 1).
 * 4. A boundary point is inside; signed distances -1 at the square's centre and 2
 *    at (3, 0); (3, 0) projects to (1, 0), the centre to itself.
 * 5. Two unit squares overlapping by a quarter intersect in area 0.25; disjoint
 *    ones in nothing.
 * 6. Shrinking the 2 x 2 square by 0.5 leaves area 1, by 1.5 its centroid; a 1 m
 *    segment by 0.2 keeps its middle 0.6 m.
 * 7. The square's rows hold its centre and exclude (3, 0); a point's rows hold
 *    only it.
 * 8. A frame facing world +z has its left along world +x, and maps back.
 */
export function test_unit_engine_physics_physical_planar_polygon(): void {
  const signed = (polygon: readonly Polygon.IPoint[]): number =>
    polygon.reduce((sum: number, p: Polygon.IPoint, i: number): number => {
      const q: Polygon.IPoint = polygon[(i + 1) % polygon.length]!;
      return sum + p.x * q.y - q.x * p.y;
    }, 0) / 2;

  // 1. The hull, clockwise.
  const rectangle: Polygon.IPoint[] = Polygon.hull([
    { x: 2, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 0 },
  ]);
  TestValidator.equals("hull size", rectangle.length, 4);
  TestValidator.predicate("hull clockwise", signed(rectangle) < 0);

  // 2. Areas and the area centroid.
  const trapezoid: Polygon.IPoint[] = Polygon.hull([
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 3, y: 1 },
    { x: 1, y: 1 },
  ]);
  TestValidator.predicate(
    "rectangle area",
    nclose(Polygon.area(rectangle), 2, 1e-12),
  );
  TestValidator.predicate(
    "trapezoid area",
    nclose(Polygon.area(trapezoid), 3, 1e-12),
  );
  TestValidator.predicate("point area", Polygon.area([{ x: 1, y: 1 }]) === 0);
  TestValidator.equals("empty area", Polygon.area([]), 0);
  const centre: Polygon.IPoint = Polygon.centroid(trapezoid);
  TestValidator.predicate(
    "trapezoid centroid",
    nclose(centre.x, 2, 1e-12) && nclose(centre.y, 8 / 18, 1e-12),
  );

  // 3. The visible vertices, end to start.
  const square: Polygon.IPoint[] = Polygon.hull([
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ]);
  TestValidator.equals("visible", Polygon.visible(square, { x: 3, y: 0 }), [
    { x: 1, y: -1 },
    { x: 1, y: 1 },
  ]);
  TestValidator.equals(
    "none visible",
    Polygon.visible(square, { x: 0, y: 0 }),
    undefined,
  );

  // 4. Inside, signed distance and projection.
  TestValidator.predicate(
    "boundary inside",
    Polygon.inside(square, { x: 1, y: 0.5 }),
  );
  TestValidator.predicate(
    "outside",
    !Polygon.inside(square, { x: 1.01, y: 0 }),
  );
  TestValidator.predicate(
    "signed distances",
    nclose(Polygon.signedDistance(square, { x: 0, y: 0 }), -1, 1e-12) &&
      nclose(Polygon.signedDistance(square, { x: 3, y: 0 }), 2, 1e-12),
  );
  TestValidator.equals("projection", Polygon.project(square, { x: 3, y: 0 }), {
    x: 1,
    y: 0,
  });
  TestValidator.equals(
    "projection inside",
    Polygon.project(square, { x: 0.5, y: 0 }),
    {
      x: 0.5,
      y: 0,
    },
  );

  // 5. Intersection.
  const unit = (x: number, y: number): Polygon.IPoint[] =>
    Polygon.hull([
      { x, y },
      { x: x + 1, y },
      { x: x + 1, y: y + 1 },
      { x, y: y + 1 },
    ]);
  TestValidator.predicate(
    "overlap",
    nclose(
      Polygon.area(Polygon.intersect(unit(0, 0), unit(0.5, 0.5))),
      0.25,
      1e-12,
    ),
  );
  TestValidator.equals(
    "disjoint",
    Polygon.intersect(unit(0, 0), unit(2, 0)),
    [],
  );

  // 6. Shrink.
  TestValidator.predicate(
    "shrink",
    nclose(Polygon.area(Polygon.shrink(square, 0.5)), 1, 1e-12),
  );
  TestValidator.equals("collapse", Polygon.shrink(square, 1.5).length, 1);
  const segment: Polygon.IPoint[] = Polygon.shrink(
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    0.2,
  );
  TestValidator.predicate(
    "segment",
    nclose(segment[0]!.x, 0.2, 1e-12) && nclose(segment[1]!.x, 0.8, 1e-12),
  );

  // 7. Rows.
  const holds = (
    rows: { a: [number, number]; b: number }[],
    p: Polygon.IPoint,
  ): boolean =>
    rows.every(
      (row: { a: [number, number]; b: number }): boolean =>
        row.a[0] * p.x + row.a[1] * p.y <= row.b + 1e-12,
    );
  TestValidator.predicate(
    "rows hold centre",
    holds(Polygon.rows(square), { x: 0, y: 0 }),
  );
  TestValidator.predicate(
    "rows exclude",
    !holds(Polygon.rows(square), { x: 3, y: 0 }),
  );
  const point: { a: [number, number]; b: number }[] = Polygon.rows([
    { x: 0.3, y: -0.2 },
  ]);
  TestValidator.predicate(
    "point rows",
    holds(point, { x: 0.3, y: -0.2 }) && !holds(point, { x: 0.31, y: -0.2 }),
  );

  // 8. The frame: left = up x forward.
  const frame: Polygon.IFrame = {
    origin: { x: 0, z: 0 },
    forward: { x: 0, z: 1 },
  };
  TestValidator.equals("left", Polygon.local(frame, { x: 1, z: 0 }), {
    x: 0,
    y: 1,
  });
  const back: { x: number; z: number } = Polygon.world(
    frame,
    Polygon.local(frame, { x: 0.3, z: -0.7 }),
  );
  TestValidator.predicate(
    "round trip",
    nclose(back.x, 0.3, 1e-12) && nclose(back.z, -0.7, 1e-12),
  );
}
