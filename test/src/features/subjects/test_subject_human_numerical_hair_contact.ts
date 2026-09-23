import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import {
  buildHumanFaceHairMesh,
  integrateHumanFaceHairCurve,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose } from "../internal/predicates";

/**
 * A concave solid supplies a real obstacle independently of the comb field.
 * The empty quadrant of an L-shaped voxel union lies above y=1 and right of
 * x=1. Its two perpendicular walls force a leftward lock to turn upward.
 * Scenarios:
 * 1. Integration retains its authored 50 mm length around the reentrant wall.
 * 2. All free ribbon vertices retain the requested clearance from the solid,
 *    although the ribbon is five times as wide as the clearance its fibre was
 *    integrated with: the mesh owner narrows it against the same walls.
 * 3. Measured free chords obey the step bound including arithmetic allowance.
 */
export const test_subject_human_numerical_hair_contact = (): void => {
  const layer = createNumericalHairFixture().layers[0];
  layer.flow = [-1, 0.25, 0];
  layer.lift.strength = 0;
  const query = createAutoMovieSignedMeshQuery(
    createSignedVoxelUnion([
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ]),
  );
  const curve = integrateHumanFaceHairCurve({
    layer,
    origin: Vector3.create(),
    reference: Vector3.create(1.03, 1, 0.5),
    root: Vector3.create(1.03, 1, 0.5),
    normal: Vector3.create(0, 1, 0),
    sequence: 1,
    query,
  });
  const lengths = curve.points
    .slice(1)
    .map((point, at) =>
      Vector3.length(Vector3.subtract(point, curve.points[at])),
    );
  TestValidator.predicate(
    "length through contact",
    nclose(
      lengths.reduce((a, b) => a + b, 0),
      0.05,
      1e-12,
    ),
  );
  const end = curve.points[curve.points.length - 1];
  TestValidator.predicate(
    "wall turns the leftward flow",
    end.x > 1 && end.y > 1.02,
  );
  TestValidator.predicate(
    "bounded free steps",
    lengths.slice(1).every((value) => value <= layer.samplingStep + 1e-12),
  );
  const mesh = buildHumanFaceHairMesh([curve], layer, {
    widths: [0.01],
    query,
  });
  for (let at = 3; at < mesh.positions.length; at += 3)
    TestValidator.predicate(
      "free strip retains requested clearance",
      query(mesh.positions.slice(at, at + 3)).signedDistance >=
        layer.clearance - 1e-12,
    );
};
