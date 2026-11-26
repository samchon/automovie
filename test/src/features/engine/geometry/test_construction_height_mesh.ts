import { AutoMovieSolidHeightMesh as Mesh } from "@automovie/engine";
import type { AutoMovieVector2Tuple as Point } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The physical plane mesh preserves the exact edges of a nonconvex outline.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public height mesh plan with native indices, shared poles, collinear vertices and tied stations on opposite sides. Checks both the original outline and the assembled core-to-side edges.
 * @evidence contracts/development/testing.md#independent-expectations The two literal piecewise-linear chains have areas 13 and 13.5 below and above the baseline. Exact incidence and winding, positive triangle areas and total double area 53 witness the complete planar partition.
 */
export function test_construction_height_mesh(): void {
  const outline: Point[] = [
    [0, 0],
    [1, -2],
    [2, -3],
    [3, -1],
    [4, -1],
    [5, -1],
    [6, -3],
    [7, -2],
    [8, 0],
    [7, 3],
    [5, 0.5],
    [3, 2],
    [2, 2],
    [1, 3],
  ];
  const boundary = outline.map((chart, id): Mesh.IBoundary => ({ id, chart }));
  const planned = Mesh.prepare({
    boundary,
    height: [0, 0, 1],
    section: [1, 0, 0],
    span: [0, 1, 0],
    stations: [0.5, 2.5, 4.5, 7.5],
    columns: 4,
    firstId: boundary.length,
    row: () => ({
      lo: -4,
      hi: 4,
      hull: [],
      residual: 0,
      at: () => ({ height: 0, longitudinal: 0, transverse: 0 }),
      transverseSecond: () => () => 0,
    }),
  });
  if (typeof planned === "string") throw new Error(planned);

  const points = [...boundary, ...planned.vertices].map(({ chart }) => chart);
  const edges = new Map<string, { count: number; direction: number }>();
  const edgeKey = (a: number, b: number): string =>
    a < b ? `${a},${b}` : `${b},${a}`;
  const outer = new Map(
    boundary.map(({ id }, i) => {
      const next = boundary[(i + 1) % boundary.length]!.id;
      return [edgeKey(id, next), Math.sign(next - id)] as const;
    }),
  );
  let twiceArea = 0;
  for (const [i, j, k] of planned.triangles) {
    const a = points[i]!;
    const b = points[j]!;
    const c = points[k]!;
    const area =
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    TestValidator.predicate("positive projected winding", area > 0);
    twiceArea += area;
    for (const [from, to] of [[i, j], [j, k], [k, i]] as const) {
      const key = edgeKey(from, to);
      const incident = edges.get(key) ?? { count: 0, direction: 0 };
      incident.count++;
      incident.direction += Math.sign(to - from);
      edges.set(key, incident);
    }
  }
  TestValidator.predicate(
    "triangles cover the exact original plane area",
    Math.abs(twiceArea - 53) < 1e-12,
  );
  TestValidator.predicate(
    "every authored edge appears",
    [...outer.keys()].every((key) => edges.has(key)),
  );
  for (const [key, incident] of edges) {
    const boundaryDirection = outer.get(key);
    TestValidator.equals(
      `edge use and direction for ${key}`,
      incident,
      boundaryDirection === undefined
        ? { count: 2, direction: 0 }
        : { count: 1, direction: boundaryDirection },
    );
  }
}
