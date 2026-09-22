import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { buildHumanFaceHairMesh } from "@automovie/human/face/anatomy/hair/buildHumanFaceHairMesh";
import { integrateHumanFaceHairCurve } from "@automovie/human/face/anatomy/hair/integrateHumanFaceHairCurve";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Rendered ribbon stations preserve the integrator's actual metric curve.
 * Scenarios:
 * 1. A lock normal to a unit cube stays straight, rooted and exactly 50 mm long;
 *    averaged mesh rows reproduce its centreline and UV v measures that length.
 * 2. Short emergence and a singular length chart refuse instead of shortening.
 * 3. Empty curves remain empty; antiparallel transport, a subnormal width and
 *    a missing per-curve width refuse.
 */
export const test_subject_human_numerical_hair_curve = (): void => {
  const layer = createNumericalHairFixture().layers[0];
  layer.flow = [1, 0, 0];
  layer.lift.strength = 0;
  const props = {
    layer,
    origin: Vector3.create(),
    reference: Vector3.create(1, 0.5, 0.5),
    root: Vector3.create(1, 0.5, 0.5),
    normal: Vector3.create(1, 0, 0),
    sequence: 1,
    query: createAutoMovieSignedMeshQuery(createSignedVoxelUnion([[0, 0, 0]])),
  };
  const curve = integrateHumanFaceHairCurve(props);
  const measured = curve.points
    .slice(1)
    .reduce(
      (sum, p, at) =>
        sum + Vector3.length(Vector3.subtract(p, curve.points[at])),
      0,
    );
  TestValidator.predicate(
    "authored metric length",
    nclose(measured, 0.05, 1e-12),
  );
  TestValidator.predicate(
    "surface root",
    vclose(curve.points[0], props.root, 1e-12),
  );
  TestValidator.predicate(
    "straight endpoint",
    vclose(
      curve.points[curve.points.length - 1],
      Vector3.create(1.05, 0.5, 0.5),
      1e-12,
    ),
  );
  const mesh = buildHumanFaceHairMesh([curve], layer, {
    widths: [0.002],
    query: props.query,
  });
  TestValidator.equals(
    "single fan then paired rows",
    mesh.positions.length / 3,
    1 + 2 * (curve.points.length - 1),
  );
  for (let at = 1; at < curve.points.length; at++) {
    const offset = 3 * (2 * at - 1);
    const center = Vector3.create(
      ...([0, 1, 2].map(
        (axis) =>
          (mesh.positions[offset + axis] + mesh.positions[offset + 3 + axis]) /
          2,
      ) as [number, number, number]),
    );
    TestValidator.predicate(
      "mesh uses actual station",
      vclose(center, curve.points[at], 1e-12),
    );
    TestValidator.predicate(
      "metric UV",
      nclose(mesh.uvs![(2 * at - 1) * 2 + 1], (center.x - 1) / 0.05, 1e-12),
    );
  }
  TestValidator.predicate(
    "short emergence refuses",
    throwsError(() =>
      integrateHumanFaceHairCurve({
        ...props,
        layer: {
          ...layer,
          lengthAxes: [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
        },
      }),
    ),
  );
  TestValidator.predicate(
    "singular chart refuses",
    throwsError(() =>
      integrateHumanFaceHairCurve({ ...props, reference: props.origin }),
    ),
  );
  TestValidator.equals(
    "empty mesh",
    buildHumanFaceHairMesh([], layer, { widths: [], query: props.query })
      .positions,
    [],
  );
  TestValidator.predicate(
    "antiparallel transport refuses",
    throwsError(() =>
      buildHumanFaceHairMesh(
        [
          {
            ...curve,
            points: [
              Vector3.create(),
              Vector3.create(1, 0, 0),
              Vector3.create(0.1, 0, 0),
              Vector3.create(-1, 0, 0),
            ],
          },
        ],
        layer,
        { widths: [0.002], query: props.query },
      ),
    ),
  );
  TestValidator.predicate(
    "unrepresentable ribbon width refuses",
    throwsError(() =>
      buildHumanFaceHairMesh([curve], layer, {
        widths: [Number.MIN_VALUE],
        query: props.query,
      }),
    ),
  );
  TestValidator.predicate(
    "a ribbon without its own width refuses",
    throwsError(() =>
      buildHumanFaceHairMesh([curve], layer, {
        widths: [],
        query: props.query,
      }),
    ),
  );
};
