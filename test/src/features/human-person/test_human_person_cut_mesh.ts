import { clipHumanPersonMesh } from "@automovie/human/human/seam/clipHumanPersonMesh";
import { createHumanPersonCut } from "@automovie/human/human/seam/createHumanPersonCut";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Shared geometry crosses an atlas seam without merging its corner attributes.
 * Independent midpoint arithmetic supplies all expectations.
 *
 * Scenarios:
 * 1. Two triangles share source edge 0-2 but use disjoint UV charts. Its one
 *    source crossing has two render residents, each with its own UV/color/relief.
 * 2. Null and absent attributes remain null/absent, empty output stays empty,
 *    and skinned or nonindexed input refuses beside a valid static twin.
 * 3. Exact endpoints, duplicate source edges, invalid and unrepresentable
 *    finite samples exercise the cut constructor's numerical admission.
 */
export const test_human_person_cut_mesh = (): void => {
  const cut = createHumanPersonCut([0, 1, 2, 0, 2, 3], [-1, -1, 1, -1]);
  TestValidator.equals("one crossing per undirected edge", cut.intersections.length, 3);
  const mesh: IAutoMovieMesh = {
    positions: [0, -1, 0, 2, -1, 0, 2, 1, 0, 0, -1, 0, 2, 1, 0, 0, -1, 2],
    normals: Array.from({ length: 6 }, () => [0, 0, 1]).flat(),
    uvs: [0, 0, 1, 0, 1, 1, 2, 0, 3, 1, 2, 1],
    colors: [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    reliefWeights: [0, 1, 1, 0, 1, 1],
    indices: [0, 1, 2, 3, 4, 5], skin: null,
  };
  const output = clipHumanPersonMesh(mesh, [0, 1, 2, 0, 2, 3], cut);
  const crossing = cut.margins.length + cut.intersections.findIndex((v) => v.a === 0 && v.b === 2);
  const residents = output.sources.flatMap((source, index) => source === crossing ? [index] : []);
  TestValidator.equals("UV charts retain two residents of one source crossing", residents.length, 2);
  TestValidator.predicate("each chart has its independently interpolated attributes", residents.every((v, chart) =>
    nclose(output.mesh.uvs![v * 2], chart === 0 ? 0.5 : 2.5) &&
    nclose(output.mesh.uvs![v * 2 + 1], 0.5) &&
    nclose(output.mesh.colors![v * 3], 0.5) &&
    nclose(output.mesh.reliefWeights![v], 0.5) &&
    nclose(output.mesh.positions[v * 3], 1) &&
    nclose(output.mesh.positions[v * 3 + 1], 0) &&
    nclose(output.mesh.normals![v * 3 + 2], 1),
  ));
  TestValidator.equals("inputs remain owned by caller", mesh.positions.length, 18);
  const plain = { positions: mesh.positions, normals: null, uvs: null, indices: mesh.indices, skin: null };
  const absent = clipHumanPersonMesh(plain, [0, 1, 2, 0, 2, 3], cut).mesh;
  TestValidator.equals("null and absent attributes preserve meaning", [absent.normals, absent.uvs, absent.colors, absent.reliefWeights], [null, null, undefined, undefined]);
  TestValidator.equals("empty topology has no residents", clipHumanPersonMesh({ ...plain, indices: [] }, [], cut).sources, []);
  TestValidator.predicate("nonindexed twin refuses", throwsError(() => clipHumanPersonMesh({ ...plain, indices: null }, [], cut), "static indexed"));
  TestValidator.predicate("unposed skin twin refuses", throwsError(() => clipHumanPersonMesh({ ...plain, skin: {} as NonNullable<IAutoMovieMesh["skin"]> }, [], cut), "static indexed"));
  TestValidator.equals("endpoint crossings add no vertices", createHumanPersonCut([0, 1, 2], [0, -1, 1]).intersections.length, 1);
  TestValidator.equals("empty scalar input is admitted", createHumanPersonCut([], []).indices, []);
  TestValidator.predicate("nonfinite sample refuses", throwsError(() => createHumanPersonCut([0, 1, 2], [NaN, -1, 1]), "finite scalar"));
  TestValidator.predicate("underflowed edge fraction refuses", throwsError(() => createHumanPersonCut([0, 1, 2], [-Number.MIN_VALUE, Number.MIN_VALUE, 1]), "finite edge"));
  TestValidator.predicate("rounded endpoint fraction refuses", throwsError(() => createHumanPersonCut([0, 1, 2], [-1e-300, 1e300, 1e300]), "finite edge"));
};
