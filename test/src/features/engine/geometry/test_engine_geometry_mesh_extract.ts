import { AutoMovieMeshExtract } from "@automovie/engine";
import type {
  IAutoMovieMeshSectionCut,
  IAutoMovieMillimeterMesh,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `AutoMovieMeshExtract` reads exact plane sections off a triangle mesh and
 * reduces a dense line to the fewest cubic Hermite knots within a tolerance.
 *
 * Mesh: the cube [0, 10]^3 mm in twelve triangles; frame: the world axes at the
 * origin, stations along z (axis 2).
 *
 * Scenarios:
 *
 * 1. `outline` at z = 5: one station 5 with eight edge crossings chained into one
 *    closed loop of eight points (the four corners and the four edge midpoints
 *    where the face diagonals cross), which is also the outer boundary, no
 *    flag, and the extremes along +a, +b, -a, -b of reach 10, 10, 0, 0, and
 *    along the diagonal +a+b of reach 10 sqrt 2 (to the corner (10, 10)).
 * 2. A single triangle (0,0,0), (10,0,0), (0,10,10) cut at z = 5 gives one segment
 *    that cannot close: the sample is flagged "open".
 * 3. `reduce` of the straight dense run (0,0) to (4,4) at tolerance 0.01 keeps
 *    only its two ends with slope 1 and zero error; the tent (0,0), (1,1),
 *    (2,2), (3,1), (4,0) keeps its peak as well: indices 0, 2, 4.
 * 4. Reusing a prepared outline on the triangle at z = 2 retains its cut flags.
 *    The same station has jump flags only in a query with neighbours.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the millimetre fixtures, closed and open cuts, line reductions and prepared-query isolation.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public outline, prepared outline and reducer directly on a cube, a triangle and two polylines.
 * @evidence contracts/development/testing.md#independent-expectations Cube face diagonals determine the section vertices. The triangle has open ends and its +b reaches at stations 1, 2 and 9 give a middle departure of 2 - (1 + 9) / 2 = -3 mm. The straight line and tent distinguish removable samples from the retained peak.
 */
export function test_engine_geometry_mesh_extract(): void {
  const positions: number[] = [];
  for (let c: number = 0; c < 8; c++)
    positions.push((c & 1) * 10, ((c >> 1) & 1) * 10, ((c >> 2) & 1) * 10);
  const cube: IAutoMovieMillimeterMesh = {
    positions,
    indices: [
      0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6, 0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0,
      4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5,
    ],
  };
  const world: Parameters<typeof AutoMovieMeshExtract.outline>[1] = {
    origin: [0, 0, 0],
    axes: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  };
  const cuts: IAutoMovieMeshSectionCut[] = AutoMovieMeshExtract.outline(
    cube,
    world,
    [5],
    2,
  );
  TestValidator.equals("stations", cuts.length, 1);
  const cut: IAutoMovieMeshSectionCut = cuts[0]!;
  TestValidator.equals("station", cut.station, 5);
  TestValidator.equals("crossings", cut.count, 8);
  TestValidator.equals("one loop", cut.loops.length, 1);
  TestValidator.equals("loop points", cut.loops[0]!.points.length, 8);
  TestValidator.equals("closed", cut.loops[0]!.closed, true);
  TestValidator.equals("outer boundary", cut.outer, cut.loops);
  TestValidator.equals("no flags", cut.flags, []);
  TestValidator.equals("+a", cut.extremes!["+a"].reach, 10);
  TestValidator.equals("+b", cut.extremes!["+b"].reach, 10);
  TestValidator.equals("-a", cut.extremes!["-a"].reach, 0);
  TestValidator.equals("-b", cut.extremes!["-b"].reach, 0);
  TestValidator.predicate(
    "+a+b",
    nclose(cut.extremes!["+a+b"].reach, 10 * Math.SQRT2, 1e-12),
  );

  const triangle: IAutoMovieMillimeterMesh = {
    positions: [0, 0, 0, 10, 0, 0, 0, 10, 10],
    indices: [0, 1, 2],
  };
  const open: IAutoMovieMeshSectionCut[] = AutoMovieMeshExtract.outline(
    triangle,
    world,
    [5],
    2,
  );
  TestValidator.equals(
    "open flag",
    open[0]!.flags.some((flag: string): boolean => flag.startsWith("open:")),
    true,
  );

  const line = AutoMovieMeshExtract.reduce(
    [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ],
    0.01,
  );
  TestValidator.equals(
    "line knots",
    line.knots.map((knot) => knot.index),
    [0, 4],
  );
  TestValidator.equals(
    "line slopes",
    line.knots.map((knot) => knot.slope),
    [1, 1],
  );
  TestValidator.equals("line error", line.error, 0);
  const tent = AutoMovieMeshExtract.reduce(
    [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 1],
      [4, 0],
    ],
    0.01,
  );
  TestValidator.equals(
    "tent knots",
    tent.knots.map((knot) => knot.index),
    [0, 2, 4],
  );

  const prepared: ReturnType<typeof AutoMovieMeshExtract.prepareOutline> =
    AutoMovieMeshExtract.prepareOutline(triangle, world, 2);
  const batch: IAutoMovieMeshSectionCut[] = prepared([1, 2, 9], 0.5, 0);
  const isolated: IAutoMovieMeshSectionCut = prepared([2], 0.5, 0)[0]!;
  TestValidator.equals("triangle cut flags", isolated.flags, [
    "open: 2 dangling crossings in 1 broken chains",
    "unclosed: 1 chains left open past the 0 mm bridge",
  ]);
  TestValidator.equals(
    "batched cut flags",
    batch[1]!.flags.filter(
      (flag: string): boolean => !flag.startsWith("jump "),
    ),
    isolated.flags,
  );
  TestValidator.predicate(
    "batched jump",
    batch[1]!.flags.includes("jump +b: -3.000 mm"),
  );
}
