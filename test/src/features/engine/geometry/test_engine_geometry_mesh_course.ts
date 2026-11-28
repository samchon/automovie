import { AutoMovieEngineMeshCourse } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieMeshCourse,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `AutoMovieEngineMeshCourse` cuts a mesh on a course plane and reads the loop that
 * holds the course point; `newell` and `centroid` read a closed polygon.
 *
 * Scenarios:
 *
 * 1. `newell` of the counter-clockwise square (0,0,0), (2,0,0), (2,2,0), (0,2,0)
 *    is (0,0,8), twice its area 4 along +z; reversed it is (0,0,-8); of the
 *    triangle (0,0,0), (3,0,0), (0,3,0) it is (0,0,9).
 * 2. `centroid` of the square is (1,1,0) and of the triangle (1,1,0), in either
 *    winding; fewer than three points and three collinear points have none.
 * 3. `cut` of the cube [-5, 5]^3 mm (twelve triangles) on the plane z = 0 with
 *    origin (0,0,0), u = +x, v = +y: one piece, the eight-point loop of the
 *    square [-5, 5]^2, area 100, centroid (0,0,0), normal (0,0,-1) (v x u),
 *    extents 5, -5, 5, -5 along +u, -u, +v, -v, reach 5 sqrt 2 from the course
 *    point to the corner, and no flag or check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names Newell direction, centroids, degenerate contours and the millimetre cube cut.
 * @evidence contracts/development/testing.md#behavioral-verification Reads polygon area normals and centres and cuts an explicit twelve-triangle cube with the XY course plane.
 * @evidence contracts/development/testing.md#independent-expectations The polygon coordinates fix signed double-area and centroid. At z = 0 the cube section is a 10 mm square with area 100 and reach 5√2.
 */
export function test_engine_geometry_mesh_course(): void {
  const p = (x: number, y: number, z: number): AutoMovieVector3Tuple => [
    x,
    y,
    z,
  ];
  const square: AutoMovieVector3Tuple[] = [
    p(0, 0, 0),
    p(2, 0, 0),
    p(2, 2, 0),
    p(0, 2, 0),
  ];
  const triangle: AutoMovieVector3Tuple[] = [
    p(0, 0, 0),
    p(3, 0, 0),
    p(0, 3, 0),
  ];
  TestValidator.equals(
    "square newell",
    AutoMovieEngineMeshCourse.newell(square),
    p(0, 0, 8),
  );
  TestValidator.equals(
    "reversed newell",
    AutoMovieEngineMeshCourse.newell([...square].reverse()),
    p(0, 0, -8),
  );
  TestValidator.equals(
    "triangle newell",
    AutoMovieEngineMeshCourse.newell(triangle),
    p(0, 0, 9),
  );
  TestValidator.equals(
    "square centroid",
    AutoMovieEngineMeshCourse.centroid(square),
    p(1, 1, 0),
  );
  TestValidator.equals(
    "reversed centroid",
    AutoMovieEngineMeshCourse.centroid([...square].reverse()),
    p(1, 1, 0),
  );
  TestValidator.equals(
    "triangle centroid",
    AutoMovieEngineMeshCourse.centroid(triangle),
    p(1, 1, 0),
  );
  TestValidator.equals(
    "two points",
    AutoMovieEngineMeshCourse.centroid([p(0, 0, 0), p(1, 0, 0)]),
    null,
  );
  TestValidator.equals(
    "collinear",
    AutoMovieEngineMeshCourse.centroid([p(0, 0, 0), p(1, 0, 0), p(2, 0, 0)]),
    null,
  );

  const positions: number[] = [];
  for (let c: number = 0; c < 8; c++)
    positions.push(
      (c & 1) * 10 - 5,
      ((c >> 1) & 1) * 10 - 5,
      ((c >> 2) & 1) * 10 - 5,
    );
  const indices: number[] = [
    0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6, 0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0,
    4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5,
  ];
  const sections: IAutoMovieMeshCourse.ISection[] = AutoMovieEngineMeshCourse.cut(
    { positions, indices },
    [{ station: 0, origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0] }],
  );
  TestValidator.equals("sections", sections.length, 1);
  const section: IAutoMovieMeshCourse.ISection = sections[0]!;
  TestValidator.equals("pieces", section.pieces, 1);
  TestValidator.equals("loop points", section.loop?.length, 8);
  TestValidator.equals("area", section.area, 100);
  TestValidator.equals("centroid", section.centroid, p(0, 0, 0));
  TestValidator.equals("normal", section.normal, p(0, 0, -1));
  TestValidator.equals("extents", section.reading?.extents, [5, -5, 5, -5]);
  TestValidator.predicate(
    "reach",
    nclose(section.reach!, 5 * Math.SQRT2, 1e-12),
  );
  TestValidator.equals("flags", section.flags, []);
  TestValidator.equals("checks", section.checks, []);
}
