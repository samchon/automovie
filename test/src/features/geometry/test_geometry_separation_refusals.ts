import { IAutoMovieVector3, IAutoMovieMeshPhysicalVertices, IAutoMovieMeshSkin, IAutoMovieMesh } from "@automovie/interface";
import { IAutoMovieMeshSeparationQuery } from "../../../../packages/engine/src/geometry/IAutoMovieMeshSeparationQuery";
import { IAutoMovieMeshSeparationResult } from "../../../../packages/engine/src/geometry/IAutoMovieMeshSeparationResult";
import { IAutoMovieMeshQueryBudget } from "../../../../packages/engine/src/geometry/IAutoMovieMeshQueryBudget";
import { boundAutoMovieConvexSeparation } from "../../../../packages/engine/src/geometry/boundAutoMovieConvexSeparation";
import { boundAutoMovieProjectionSeparation } from "../../../../packages/engine/src/geometry/boundAutoMovieProjectionSeparation";
import { createAutoMovieMeshSeparationQuery } from "../../../../packages/engine/src/geometry/createAutoMovieMeshSeparationQuery";
import { TestValidator } from "@nestia/e2e";
/**
 * Unsupported represented arithmetic and malformed requested work refuse by
 * name rather than returning a separation that a consumer could accept.
 * Scenarios:
 * 1. Adjacent finite ordinary coordinates and positive targets are supported.
 * 2. Empty/oversized features, nonfinite inputs and invalid targets refuse.
 * 3. Difference overflow and an outward enclosure beyond finite range refuse.
 * 4. Invalid resident topology/coordinates and invalid query budgets refuse.
  *
 * @evidence contracts/testing.md#behavioral-verification Executes convex/projection bounds and resident mesh separation queries, asserting named refusals so malformed geometry or unrepresentable outward bounds cannot become a certificate.
 * @evidence contracts/testing.md#independent-expectations A point one metre above a triangle admits a half-metre threshold; IEEE binary64 range endpoints define overflow, while contract ranges define invalid budgets and clearances.
 * @evidence contracts/testing.md#distinguishing-cases Includes valid positive separation beside empty/nonfinite/sparse topology, invalid budgets, missing contexts and Float32 overflow; geometric distance/witness tests own general shapes.
 * @evidence contracts/testing.md#execution-ownership The exported geometry entry reaches portable numerical and typed mesh-query source with no native artifact, consumer installation or real host.
 */
export function test_geometry_separation_refusals(): void {
  const p: (x: number, y?: number, z?: number) => IAutoMovieVector3 = (x: number, y: number = 0, z: number = 0): IAutoMovieVector3 => ({ x, y, z });
  const refuses: (name: string, run: () => unknown, part: string) => void = (name: string, run: () => unknown, part: string): void => {
    let message: string = "";
    try {
      run();
    } catch (error: unknown) {
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
      (): number => boundAutoMovieConvexSeparation(vertices, [p(1)]),
      "finite vertex",
    );
  for (const target of [-1, NaN])
    refuses(
      "invalid convex target",
      (): number => boundAutoMovieConvexSeparation([p(0)], [p(1)], target),
      "nonnegative",
    );
  refuses(
    "empty projection",
    (): number => boundAutoMovieProjectionSeparation([], [p(1)], p(1)),
    "nonempty finite",
  );
  refuses(
    "nonfinite direction",
    (): number => boundAutoMovieProjectionSeparation([p(0)], [p(1)], p(Infinity)),
    "nonempty finite",
  );
  refuses(
    "projection difference overflow",
    (): number =>
      boundAutoMovieProjectionSeparation(
        [p(-Number.MAX_VALUE)],
        [p(Number.MAX_VALUE)],
        p(1),
      ),
    "representable",
  );
  refuses(
    "enclosure overflow",
    (): number =>
      boundAutoMovieProjectionSeparation([p(0)], [p(Number.MAX_VALUE)], p(1)),
    "overflowing infinity",
  );
  refuses(
    "face difference overflow",
    (): number =>
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
      (): IAutoMovieMeshSeparationQuery => createAutoMovieMeshSeparationQuery(resident),
      "nonempty finite",
    );
  refuses(
    "invalid topology",
    (): IAutoMovieMeshSeparationQuery => createAutoMovieMeshSeparationQuery({ ...mesh, indices: [0, 1, 9] }),
    "vertex",
  );
  const query: IAutoMovieMeshSeparationQuery = createAutoMovieMeshSeparationQuery(mesh);
  TestValidator.equals(
    "adjacent positive finite query",
    query([p(0, 0, 1)], { clearance: 0.5, budget: { remaining: 1 } }).certified,
    true,
  );
  for (const clearance of [-1, NaN, Infinity])
    refuses(
      "invalid requested clearance",
      (): IAutoMovieMeshSeparationResult => query([p(0, 0, 1)], { clearance, budget: { remaining: 10 } }),
      "nonnegative finite",
    );
  for (const remaining of [-1, 0.5, NaN, Infinity]) {
    const budget: { remaining: number; } = { remaining };
    refuses(
      "invalid shared budget",
      (): IAutoMovieMeshSeparationResult => query([p(0, 0, 1)], { clearance: 0.5, budget }),
      "safe-integer",
    );
    TestValidator.predicate(
      "invalid budget remains caller-owned, including NaN identity",
      Object.is(budget.remaining, remaining),
    );
  }
  refuses(
    "query nonfinite",
    (): IAutoMovieMeshSeparationResult => query([p(NaN)], { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
  refuses(
    "query empty",
    (): IAutoMovieMeshSeparationResult => query([], { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
  refuses(
    "sparse query coordinates",
    (): IAutoMovieMeshSeparationResult => query(new Array(3), { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
  refuses(
    "sparse resident positions",
    (): IAutoMovieMeshSeparationQuery =>
      createAutoMovieMeshSeparationQuery({ ...mesh, positions: new Array(9) }),
    "finite",
  );
  refuses(
    "sparse resident indices",
    (): IAutoMovieMeshSeparationQuery =>
      createAutoMovieMeshSeparationQuery({ ...mesh, indices: new Array(3) }),
    "vertex",
  );
  refuses(
    "invalid representation",
    (): IAutoMovieMeshSeparationQuery => createAutoMovieMeshSeparationQuery(mesh, "other" as "source"),
    "representation",
  );
  const beyondFloat32: { positions: number[]; physicalVertices?: IAutoMovieMeshPhysicalVertices; normals: number[] | null; uvs: number[] | null; colors?: number[]; reliefWeights?: number[]; indices: number[] | null; skin: IAutoMovieMeshSkin | null; } = {
    ...mesh,
    positions: mesh.positions.map((value: number): number => value * 1e39),
  };
  createAutoMovieMeshSeparationQuery(beyondFloat32);
  refuses(
    "finite source vertices cannot authorize overflowing Float32 vertices",
    (): IAutoMovieMeshSeparationQuery => createAutoMovieMeshSeparationQuery(beyondFloat32, "float32"),
    "finite represented resident vertices",
  );
  for (const absent of [undefined, null]) {
    refuses(
      "legacy missing context",
      (): IAutoMovieMeshSeparationResult =>
        query([p(0, 0, 1)], absent as unknown as Parameters<typeof query>[1]),
      "nonnegative finite",
    );
    refuses(
      "legacy missing budget",
      (): IAutoMovieMeshSeparationResult =>
        query([p(0, 0, 1)], {
          clearance: 0.5,
          budget: absent as unknown as IAutoMovieMeshQueryBudget,
        }),
      "safe-integer",
    );
  }
}
