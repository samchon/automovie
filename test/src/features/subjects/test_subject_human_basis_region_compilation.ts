import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisRegion,
  humanFaceBasisRegion,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Compiled UV correspondence depends on topology, never on an earlier face.
 * Expected gathers are small explicit permutations of independently supplied
 * vectors, including an intentional UV seam on the repeated source vertex.
 *
 * Scenarios:
 * 1. Shared UVs reuse a vertex; a different UV duplicates its position/normal.
 * 2. Input topology and prior output mutations cannot alter a later result.
 * 3. Untextured regions reuse source identities and preserve null UVs.
 * 4. An empty region emits owned empty arrays without inventing vertices.
 */
export const test_subject_human_basis_region_compilation = (): void => {
  const region: IAutoMovieHumanFaceBasis["surfaces"][number]["regions"][number] =
    {
      id: "region",
      material: "skin",
      indices: [0, 1, 2, 0, 2, 1],
      uvs: [0, 0, 1, 0, 0, 1, 0.5, 0, 0, 1, 1, 0],
    };
  const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const normals = [0, 0, 1, 0, 1, 0, 1, 0, 0];
  const evaluate = createHumanFaceBasisRegion(region);
  const expected = {
    positions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3],
    normals: [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    indices: [0, 1, 2, 3, 2, 1],
    uvs: [0, 0, 1, 0, 0, 1, 0.5, 0],
    skin: null,
  };
  const first = evaluate(positions, normals);
  TestValidator.equals("compiled gather", first, expected);
  TestValidator.equals(
    "one-shot public evaluator",
    humanFaceBasisRegion(positions, normals, region),
    expected,
  );
  first.positions[0] = 99;
  first.normals![0] = 99;
  first.indices![0] = 99;
  first.uvs![0] = 99;
  region.indices.fill(2);
  region.uvs!.fill(0);
  TestValidator.equals(
    "owned correspondence",
    evaluate(positions, normals),
    expected,
  );
  positions[0] = -2;
  normals[0] = -1;
  const later = evaluate(positions, normals);
  TestValidator.equals(
    "new deformation reaches both seam copies",
    [later.positions[0], later.positions[9]],
    [-2, -2],
  );
  TestValidator.equals(
    "new normals reach both seam copies",
    [later.normals![0], later.normals![9]],
    [-1, -1],
  );
  const untextured = createHumanFaceBasisRegion({
    ...region,
    indices: [2, 1, 0, 2, 0, 1],
    uvs: null,
  })(positions, normals);
  TestValidator.equals("source order without UVs", untextured, {
    positions: [7, 8, 9, 4, 5, 6, -2, 2, 3],
    normals: [1, 0, 0, 0, 1, 0, -1, 0, 1],
    indices: [0, 1, 2, 0, 2, 1],
    uvs: null,
    skin: null,
  });
  for (const uvs of [null, []])
    TestValidator.equals(
      "empty correspondence",
      createHumanFaceBasisRegion({ ...region, indices: [], uvs })([], []),
      { positions: [], normals: [], indices: [], uvs, skin: null },
    );
};
