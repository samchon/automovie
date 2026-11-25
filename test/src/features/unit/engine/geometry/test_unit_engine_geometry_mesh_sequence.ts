import { separateAutoMovieMeshSequence } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `separateAutoMovieMeshSequence(meshes, axis, gap)` translates an ordered
 * sequence rigidly along the axis so each mesh stands at least `gap` in front
 * of every earlier one where their projections overlap, in one pass.
 *
 * Fixture: triangles (x - 1, -1), (x + 1, -1), (x, 1) at depth z, with +z
 * normals, permuted onto each axis.
 *
 * Scenarios:
 *
 * 1. Depths 0, -1, 1 with gap 0.2 finish at -0.6, -0.4, 1.6 along x, y and z;
 *    normals and transverse coordinates are kept, the input unchanged, every
 *    output buffer new.
 * 2. Depths 0, then -20 moved 10 aside, then -1: the first and last still stand
 *    0.2 apart.
 * 3. Already separated, single and empty sequences are returned as they are; a
 *    finite member at 1e200 already clear needs no area arithmetic.
 * 4. Gap -1 ("clearance"), a malformed member ("triangle buffers"), travel
 *    overflow ("translation") and position overflow ("positions") refuse.
 */
export function test_unit_engine_geometry_mesh_sequence(): void {
  const plane = (z: number, x: number = 0): IAutoMovieMesh => ({
    positions: [x - 1, -1, z, x + 1, -1, z, x, 1, z],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  });

  // 1.
  for (const [axis, depth] of [
    ["x", 0],
    ["y", 1],
    ["z", 2],
  ] as const) {
    const meshes: IAutoMovieMesh[] = [0, -1, 1].map(
      (z: number): IAutoMovieMesh => {
        const mesh: IAutoMovieMesh = plane(z);
        const p: number[] = mesh.positions;
        mesh.positions = [0, 1, 2].flatMap((i: number): number[] => {
          const [u, v, d] = [p[3 * i]!, p[3 * i + 1]!, p[3 * i + 2]!];
          return axis === "x"
            ? [d, u, v]
            : axis === "y"
              ? [v, d, u]
              : [u, v, d];
        });
        return mesh;
      },
    );
    const before: string = JSON.stringify(meshes);
    const result: IAutoMovieMesh[] = separateAutoMovieMeshSequence(
      meshes,
      axis,
      0.2,
    );
    TestValidator.equals(`${axis} input kept`, JSON.stringify(meshes), before);
    [-0.6, -0.4, 1.6].forEach((target: number, j: number): void => {
      const out: IAutoMovieMesh = result[j]!;
      TestValidator.predicate(
        `${axis}/${j} placed`,
        out.positions.every((v: number, i: number): boolean =>
          i % 3 === depth
            ? Math.abs(v - target) < 1e-12
            : v === meshes[j]!.positions[i],
        ),
      );
      TestValidator.equals(
        `${axis}/${j} normals`,
        out.normals,
        meshes[j]!.normals,
      );
      TestValidator.predicate(
        `${axis}/${j} owned`,
        out !== meshes[j] && out.positions !== meshes[j]!.positions,
      );
    });
  }

  // 2.
  const apart: IAutoMovieMesh[] = separateAutoMovieMeshSequence(
    [plane(0), plane(-20, 10), plane(-1)],
    "z",
    0.2,
  );
  TestValidator.predicate(
    "first and last",
    Math.abs(apart[2]!.positions[2]! - apart[0]!.positions[2]! - 0.2) < 1e-12,
  );

  // 3.
  const clear: IAutoMovieMesh[] = [plane(0), plane(1)];
  TestValidator.equals(
    "separated",
    separateAutoMovieMeshSequence(clear, "z"),
    clear,
  );
  TestValidator.equals(
    "single",
    separateAutoMovieMeshSequence([clear[0]!], "z"),
    [clear[0]!],
  );
  TestValidator.equals("empty", separateAutoMovieMeshSequence([], "z"), []);
  const vast: IAutoMovieMesh = {
    ...plane(5),
    positions: [-1e200, -1e200, 5, 1e200, -1e200, 5, 0, 1e200, 5],
  };
  TestValidator.equals(
    "vast",
    separateAutoMovieMeshSequence([plane(0), vast], "z"),
    [plane(0), vast],
  );

  // 4.
  for (const [label, run, message] of [
    [
      "gap -1",
      (): unknown => separateAutoMovieMeshSequence([], "z", -1),
      "clearance",
    ],
    [
      "malformed",
      (): unknown =>
        separateAutoMovieMeshSequence([{ ...plane(0), positions: [NaN] }], "z"),
      "triangle buffers",
    ],
    [
      "travel",
      (): unknown =>
        separateAutoMovieMeshSequence([plane(0), plane(-1e308)], "z", 1e308),
      "translation",
    ],
    [
      "positions",
      (): unknown =>
        separateAutoMovieMeshSequence(
          [plane(0), plane(-1e308), plane(1.7e308, 10)],
          "z",
        ),
      "positions",
    ],
  ] satisfies [string, () => unknown, string][])
    TestValidator.predicate(label, throwsError(run, message));
}
