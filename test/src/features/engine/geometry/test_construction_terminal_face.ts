import { AutoMovieSolidBody, AutoMovieSolidMesh } from "@automovie/engine";
import type {
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A terminal face retains existing exact edge IDs through body publication.
 *
 * @evidence contracts/development/testing.md#independent-expectations The two four-sided unit rings and internal ring have predetermined indices and normals, independently of any loft jet or face planner.
 * @evidence contracts/development/testing.md#distinguishing-cases A throwing analytic jet exposes any fallback to analytic interior evaluation; the terminal callback must remain identical in the detached body and must be excluded from the trim atlas.
 */
export function test_construction_terminal_face(): void {
  const row: readonly P3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [-1, 0, 0],
    [0, -1, 0],
  ];
  const surface: IAutoMovieSolidSurface = {
    name: "terminal",
    domain: [0, 2],
    orientation: 1,
    jet: () => {
      throw new Error("A terminal face has no single analytic interior jet");
    },
  };
  const body = AutoMovieSolidBody.create(surface.name, [
    {
      surface,
      stations: [0, 2],
      phases: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
    },
  ]);
  body.mesh.normals = [];
  const owner = AutoMovieSolidMesh.owner(body.mesh, surface);
  for (const u of [0, 2])
    for (const [v, [x, y]] of row.entries())
      AutoMovieSolidMesh.vertex(body.mesh, [x, y, u], owner, u, v);

  const first = [0, 1, 2, 3];
  const last = [4, 5, 6, 7];
  const plan: IAutoMovieSolidMesh.ITerminal = (
    parent,
    receiver,
    begin,
    direction,
  ) => {
    TestValidator.equals("the original parent IDs", parent, first);
    TestValidator.equals("the original receiver IDs", receiver, last);
    TestValidator.equals("the original outward orientation", direction, 1);
    return {
      vertices: row.map(([x, y]): { point: P3; normal: P3 } => ({
        point: [x, y, 1],
        normal: [x, y, 0],
      })),
      triangles: row.flatMap((_, j): [number, number, number][] => {
        const before = parent[j]!;
        const after = receiver[j]!;
        const middle = begin + j;
        const next = (j + 1) % row.length;
        const across = begin + next;
        return [
          [before, parent[next]!, middle],
          [parent[next]!, across, middle],
          [middle, across, after],
          [across, receiver[next]!, after],
        ];
      }),
    };
  };
  const face = body.faces[0]!;
  const receiving = row.map(([x, y]): P3 => [x, y, 2]);
  face.terminal = { prepare: plan, receiving };
  face.cycles.push(
    {
      kind: "start",
      vertices: first,
      chart: row.map((_, j): [number, number] => [0, j]),
      neighbours: [],
    },
    {
      kind: "end",
      vertices: last,
      chart: row.map((_, j): [number, number] => [2, j]),
      neighbours: [],
    },
  );

  TestValidator.equals(
    "no unspecified endpoint",
    AutoMovieSolidBody.draw(body),
    [[]],
  );
  TestValidator.predicate(
    "the interior has no fictitious loft address",
    body.mesh.coordinates.length === 36 &&
      body.mesh.coordinates.slice(24).every(Number.isNaN),
  );
  TestValidator.equals(
    "the first-order normals",
    body.mesh.normals.slice(24),
    row.flat(),
  );
  TestValidator.equals(
    "all four held boundary corners",
    body.mesh.indices.slice(0, 12),
    [0, 1, 8, 1, 9, 8, 8, 9, 4, 9, 5, 4],
  );
  const published = AutoMovieSolidBody.publish(body);
  TestValidator.predicate(
    "same terminal reader",
    published.faces[0]!.terminal?.prepare === plan,
  );
  TestValidator.equals(
    "publication retains the independent source in receiver order",
    published.faces[0]!.terminal?.receiving,
    receiving,
  );
  TestValidator.predicate(
    "the receiving records are detached",
    published.faces[0]!.terminal!.receiving !== receiving &&
      published.faces[0]!.terminal!.receiving[0] !== receiving[0],
  );
  TestValidator.equals(
    "publication has both original rings",
    published.faces[0]!.cycles.map(({ points }) => points),
    [first, last],
  );
  TestValidator.equals(
    "the legacy surface is outside the analytic trim atlas",
    AutoMovieSolidBody.atlas(body).index,
    [],
  );
}
