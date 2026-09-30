import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { buildHumanFaceHairMesh } from "@automovie/human/face/anatomy/hair/buildHumanFaceHairMesh";
import { TestValidator } from "@nestia/e2e";

import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose } from "../internal/predicates";

/**
 * A sampled skin distance certifies later full-width ribbon stations only
 * while its 1-Lipschitz lower bound remains above the requested clearance.
 * Scenarios:
 * 1. Three stations travelling away from a cube keep their authored width and
 *    need only the first centre query; all original rows and triangles remain.
 * 2. Three stations beside the surface exhaust that bound and each centre is
 *    queried, retaining the same source-surface clearance rule.
 * 3. Stations on one straight run collapse to the fan and one row at its end.
 */
export const test_subject_human_hair_query_bound = (): void => {
  const skin = createAutoMovieSignedMeshQuery(
    createSignedVoxelUnion([[0, 0, 0]]),
  );
  const layer = { taper: { start: 0.7, tipWidth: 1 }, clearance: 0.001 };
  // Each station steps aside by more than the mesher's chord tolerance, so
  // every one is a bend and keeps its row.
  const build = (xs: number[], bend = 0.002) => {
    const points = xs.map((x, at) =>
      Vector3.create(x, 0.5 + (at % 2) * bend, 0.5),
    );
    let centreQueries = 0;
    const query: typeof skin = (point) => {
      if (
        points
          .slice(1)
          .some(
            (station) =>
              station.x === point[0] &&
              station.y === point[1] &&
              station.z === point[2],
          )
      )
        centreQueries++;
      return skin(point);
    };
    const mesh = buildHumanFaceHairMesh(
      [
        {
          points,
          length: xs[xs.length - 1] - xs[0],
          clearance: layer.clearance,
          normal: Vector3.create(1, 0, 0),
        },
      ],
      layer,
      { widths: [0.002], query },
    );
    return { mesh, centreQueries };
  };
  const clear = build([1, 1.02, 1.021, 1.022]);
  TestValidator.equals(
    "one centre query certifies free stations",
    clear.centreQueries,
    1,
  );
  TestValidator.equals(
    "every station keeps its paired ribbon row",
    clear.mesh.positions.length / 3,
    7,
  );
  TestValidator.equals(
    "one fan and two strip spans remain",
    clear.mesh.indices!.length / 3,
    5,
  );
  for (let station = 1; station <= 3; station++) {
    const first = (2 * station - 1) * 3;
    const second = first + 3;
    TestValidator.predicate(
      "certified station retains its centre and full width",
      nclose(
        (clear.mesh.positions[first] + clear.mesh.positions[second]) / 2,
        1.019 + 0.001 * station,
        1e-12,
      ) &&
        nclose(
          Math.hypot(
            clear.mesh.positions[first] - clear.mesh.positions[second],
            clear.mesh.positions[first + 1] - clear.mesh.positions[second + 1],
            clear.mesh.positions[first + 2] - clear.mesh.positions[second + 2],
          ),
          0.002,
          1e-12,
        ),
    );
  }
  const near = build([1, 1.0015, 1.0025, 1.0035]);
  TestValidator.equals(
    "uncertified stations are queried",
    near.centreQueries,
    3,
  );
  TestValidator.equals(
    "near-skin ribbon retains the same topology",
    near.mesh.indices!.length / 3,
    5,
  );
  const straight = build([1, 1.02, 1.021, 1.022], 0);
  TestValidator.equals(
    "a straight run keeps only its fan and end row",
    straight.mesh.positions.length / 3,
    3,
  );
  TestValidator.equals(
    "and one triangle",
    straight.mesh.indices!.length / 3,
    1,
  );
};
