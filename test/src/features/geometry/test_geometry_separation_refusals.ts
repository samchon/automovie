import {
  boundAutoMovieConvexSeparation,
  boundAutoMovieProjectionSeparation,
  createAutoMovieMeshSeparationQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Unsupported represented arithmetic and malformed requested work refuse by
 * name rather than returning a separation that a consumer could accept.
 * Scenarios:
 * 1. Adjacent finite ordinary coordinates and positive targets are supported.
 * 2. Empty/oversized features, nonfinite inputs and invalid targets refuse.
 * 3. Difference overflow and an outward enclosure beyond finite range refuse.
 * 4. Invalid resident topology/coordinates and invalid query budgets refuse.
 */
export const test_geometry_separation_refusals = (): void => {
  const p = (x: number, y = 0, z = 0) => ({ x, y, z });
  const refuses = (name: string, run: () => unknown, part: string): void => {
    let message = "";
    try {
      run();
    } catch (error) {
      message = (error as Error).message;
    }
    TestValidator.predicate(name, message.includes(part));
  };
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  for (const vertices of [[], [p(NaN)], [p(Infinity)]])
    refuses(
      "invalid feature",
      () => boundAutoMovieConvexSeparation(vertices, [p(1)]),
      "finite vertex",
    );
  for (const target of [-1, NaN])
    refuses(
      "invalid convex target",
      () => boundAutoMovieConvexSeparation([p(0)], [p(1)], target),
      "nonnegative",
    );
  refuses(
    "empty projection",
    () => boundAutoMovieProjectionSeparation([], [p(1)], p(1)),
    "nonempty finite",
  );
  refuses(
    "nonfinite direction",
    () => boundAutoMovieProjectionSeparation([p(0)], [p(1)], p(Infinity)),
    "nonempty finite",
  );
  refuses(
    "projection difference overflow",
    () =>
      boundAutoMovieProjectionSeparation(
        [p(-Number.MAX_VALUE)],
        [p(Number.MAX_VALUE)],
        p(1),
      ),
    "representable",
  );
  refuses(
    "enclosure overflow",
    () =>
      boundAutoMovieProjectionSeparation([p(0)], [p(Number.MAX_VALUE)], p(1)),
    "overflowing result",
  );
  refuses(
    "face difference overflow",
    () =>
      boundAutoMovieConvexSeparation(
        [p(-Number.MAX_VALUE), p(Number.MAX_VALUE), p(0, 1)],
        [p(0)],
      ),
    "face differences",
  );
  for (const resident of [
    { ...mesh, positions: [], indices: [] },
    { ...mesh, positions: [NaN, ...mesh.positions.slice(1)] },
  ])
    refuses(
      "invalid resident",
      () => createAutoMovieMeshSeparationQuery(resident),
      "nonempty finite",
    );
  refuses(
    "invalid topology",
    () => createAutoMovieMeshSeparationQuery({ ...mesh, indices: [0, 1, 9] }),
    "vertex",
  );
  const query = createAutoMovieMeshSeparationQuery(mesh);
  TestValidator.equals(
    "adjacent positive finite query",
    query([p(0, 0, 1)], { clearance: 0.5, budget: { remaining: 1 } }).certified,
    true,
  );
  for (const clearance of [-1, NaN, Infinity])
    refuses(
      "invalid requested clearance",
      () => query([p(0, 0, 1)], { clearance, budget: { remaining: 10 } }),
      "nonnegative finite",
    );
  for (const remaining of [-1, 0.5, NaN, Infinity]) {
    const budget = { remaining };
    refuses(
      "invalid shared budget",
      () => query([p(0, 0, 1)], { clearance: 0.5, budget }),
      "safe-integer",
    );
    TestValidator.predicate(
      "invalid budget remains caller-owned, including NaN identity",
      Object.is(budget.remaining, remaining),
    );
  }
  refuses(
    "query nonfinite",
    () => query([p(NaN)], { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
  refuses(
    "query empty",
    () => query([], { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
  refuses(
    "sparse query coordinates",
    () => query(new Array(3), { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
  refuses(
    "sparse resident positions",
    () =>
      createAutoMovieMeshSeparationQuery({ ...mesh, positions: new Array(9) }),
    "finite",
  );
  refuses(
    "sparse resident indices",
    () =>
      createAutoMovieMeshSeparationQuery({ ...mesh, indices: new Array(3) }),
    "vertex",
  );
  refuses(
    "invalid representation",
    () => createAutoMovieMeshSeparationQuery(mesh, "other" as "source"),
    "representation",
  );
  const beyondFloat32 = {
    ...mesh,
    positions: mesh.positions.map((value) => value * 1e39),
  };
  createAutoMovieMeshSeparationQuery(beyondFloat32);
  refuses(
    "finite source vertices cannot authorize overflowing Float32 vertices",
    () => createAutoMovieMeshSeparationQuery(beyondFloat32, "float32"),
    "finite represented resident vertices",
  );
  for (const absent of [undefined, null]) {
    refuses(
      "legacy missing context",
      () =>
        query([p(0, 0, 1)], absent as unknown as Parameters<typeof query>[1]),
      "nonnegative finite",
    );
    refuses(
      "legacy missing budget",
      () =>
        query([p(0, 0, 1)], {
          clearance: 0.5,
          budget: absent as unknown as { remaining: number },
        }),
      "safe-integer",
    );
  }
};
