import { separateAutoMovieMeshSequence } from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Ordered pair constraints produce finite rigid translations in one pass.
 * Scenarios:
 * 1. Planes at depths 0,-1,1 and gap 0.2 finish at -0.6,-0.4,1.6 on each axis.
 *    Shapes, normals and input buffers remain unchanged apart from translation.
 * 2. A disjoint middle plane cannot hide the first/last constraint. Already
 *    separated, empty and single-member sequences need no travel, including a
 *    finite member whose projected area would overflow if it were measured.
 * 3. Invalid axes, clearances, single-mesh buffers, accumulated travel and final
 *    position overflow refuse rather than returning a partially placed group.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs separateAutoMovieMeshSequence and checks rigid placement, unchanged inputs, nonadjacent constraints and refusals, catching unnecessary projected-area overflow on already-clear finite members.
 * @evidence contracts/testing.md#independent-expectations Plane depths -0.6,-0.4,1.6 follow the ordered gap inequalities and balanced endpoint travel; shape/normal ownership expectations follow rigid translation.
 * @evidence contracts/testing.md#distinguishing-cases Covers all axes, disjoint middle members, already-clear/empty/singleton sequences, malformed buffers and translation/position overflow; projected clipping details belong to mesh-clearance tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable geometry test calls TypeScript numerical source directly without a process, renderer, native build or dynamically installed consumer.
 */
export function test_geometry_mesh_sequence(): void {
  const plane: (z: number, x?: number) => IAutoMovieMesh = (
    z: number,
    x: number = 0,
  ): IAutoMovieMesh => ({
    positions: [x - 1, -1, z, x + 1, -1, z, x, 1, z],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  });
  for (const [axis, depth] of [
    ["x", 0],
    ["y", 1],
    ["z", 2],
  ] as const) {
    const meshes: IAutoMovieMesh[] = [0, -1, 1].map(
      (z: number): IAutoMovieMesh => {
        const mesh: IAutoMovieMesh = plane(z);
        mesh.positions = Array.from(
          { length: 3 },
          (_: unknown, i: number): number[] => {
            const [u, v, d]: number[] = mesh.positions.slice(i * 3, i * 3 + 3);
            return axis === "x"
              ? [d, u, v]
              : axis === "y"
                ? [v, d, u]
                : [u, v, d];
          },
        ).flat();
        return mesh;
      },
    );
    const before: IAutoMovieMesh[] = structuredClone(meshes),
      result: IAutoMovieMesh[] = separateAutoMovieMeshSequence(
        meshes,
        axis,
        0.2,
      );
    TestValidator.predicate(
      "input ownership",
      equalGeometryTestValues(meshes, before),
    );
    for (let j: number = 0; j < 3; j++) {
      TestValidator.predicate(
        "independent plane placement",
        result[j].positions.every(
          (v: number, i: number): boolean =>
            i % 3 !== depth ||
            (nclose(v - [-0.6, -0.4, 1.6][j], 0, 1e-12) &&
              Math.abs(v - [-0.6, -0.4, 1.6][j]) < 1e-12),
        ),
      );
      TestValidator.predicate(
        "rigid normal retention",
        equalGeometryTestValues(result[j].normals, meshes[j].normals),
      );
      TestValidator.predicate(
        "transverse coordinates retained",
        result[j].positions.every(
          (v: number, i: number): boolean =>
            i % 3 === depth || nclose(v, meshes[j].positions[i], 0),
        ),
      );
      TestValidator.predicate(
        "output owns buffers",
        result[j] !== meshes[j] &&
          result[j].positions !== meshes[j].positions &&
          result[j].positions.length === meshes[j].positions.length,
      );
    }
  }
  const nonadjacent: IAutoMovieMesh[] = separateAutoMovieMeshSequence(
    [plane(0), plane(-20, 10), plane(-1)],
    "z",
    0.2,
  );
  TestValidator.predicate(
    "nonadjacent constraint survives disjoint middle",
    nclose(
      nonadjacent[2].positions[2] - nonadjacent[0].positions[2] - 0.2,
      0,
      1e-12,
    ) &&
      Math.abs(
        nonadjacent[2].positions[2] - nonadjacent[0].positions[2] - 0.2,
      ) < 1e-12,
  );
  const clear: IAutoMovieMesh[] = [plane(0), plane(1)];
  TestValidator.predicate(
    "already separated",
    equalGeometryTestValues(separateAutoMovieMeshSequence(clear, "z"), clear),
  );
  TestValidator.predicate(
    "one member",
    equalGeometryTestValues(separateAutoMovieMeshSequence([clear[0]], "z"), [
      clear[0],
    ]),
  );
  TestValidator.equals("empty", separateAutoMovieMeshSequence([], "z"), []);
  const vast: IAutoMovieMesh = {
    ...plane(5),
    positions: [-1e200, -1e200, 5, 1e200, -1e200, 5, 0, 1e200, 5],
  };
  TestValidator.predicate(
    "a finite member already clear needs no projected-area arithmetic",
    equalGeometryTestValues(
      separateAutoMovieMeshSequence([plane(0), vast], "z"),
      [plane(0), vast],
    ),
  );
  for (const gap of [-1, Infinity, NaN])
    TestValidator.predicate(
      "invalid gap",
      throwsError(
        (): IAutoMovieMesh[] => separateAutoMovieMeshSequence([], "z", gap),
        "clearance",
      ),
    );
  TestValidator.predicate(
    "invalid axis on empty input",
    throwsError(
      (): IAutoMovieMesh[] => separateAutoMovieMeshSequence([], "w" as never),
      "axis",
    ),
  );
  TestValidator.predicate(
    "invalid singleton is checked",
    throwsError(
      (): IAutoMovieMesh[] =>
        separateAutoMovieMeshSequence([{ ...plane(0), positions: [NaN] }], "z"),
      "triangle buffers",
    ),
  );
  TestValidator.predicate(
    "travel overflow",
    throwsError(
      (): IAutoMovieMesh[] =>
        separateAutoMovieMeshSequence([plane(0), plane(-1e308)], "z", 1e308),
      "translation",
    ),
  );
  TestValidator.predicate(
    "position overflow",
    throwsError(
      (): IAutoMovieMesh[] =>
        separateAutoMovieMeshSequence(
          [plane(0), plane(-1e308), plane(1.7e308, 10)],
          "z",
        ),
      "positions",
    ),
  );
}
