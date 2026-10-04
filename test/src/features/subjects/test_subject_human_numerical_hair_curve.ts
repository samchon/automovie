import { Vector3 } from "@automovie/engine";
import { buildHumanFaceHairMesh } from "@automovie/human/face/anatomy/hair/buildHumanFaceHairMesh";
import { integrateHumanFaceHairCurve } from "@automovie/human/face/anatomy/hair/integrateHumanFaceHairCurve";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairCollider } from "../internal/createNumericalHairCollider";
import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Rendered ribbon stations preserve the integrator's actual metric curve.
 * Scenarios:
 * 1. A lock normal to a unit cube stays straight, rooted and exactly 50 mm long;
 *    its ribbon keeps the launch row and tip row, whose UV v measures length.
 * 2. A field asking for a tighter turn than the retained construction convention is held
 *    to it, and short emergence and a singular length chart refuse instead of
 *    shortening.
 * 3. Empty curves remain empty; antiparallel transport, a subnormal width, a
 *    station left on the surface with no room for its ribbon and a missing
 *    per-curve width refuse.
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
    ...createNumericalHairCollider(createSignedVoxelUnion([[0, 0, 0]]), {
      triangle: 2,
      weights: [1, 0, 1],
    }),
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
    ...props.meshContext,
  });
  // Even a straight lock preserves its canonical emergence row before the
  // simplifier reduces the remaining straight path to its endpoint.
  TestValidator.equals(
    "straight lock keeps launch and tip rows",
    mesh.positions.length / 3,
    2 * (curve.freeFrom + 2) - 1,
  );
  const tip = curve.points[curve.points.length - 1];
  const center = Vector3.create(
    ...([0, 1, 2].map(
      (axis) =>
        (mesh.positions[mesh.positions.length - 6 + axis] +
          mesh.positions[mesh.positions.length - 3 + axis]) /
        2,
    ) as [number, number, number]),
  );
  TestValidator.predicate(
    "mesh uses the actual last station",
    vclose(center, tip, 1e-12),
  );
  TestValidator.predicate(
    "metric UV",
    nclose(mesh.uvs![mesh.uvs!.length - 1], (center.x - 1) / 0.05, 1e-12),
  );
  // The retained 6 mm construction scale bounds requested turns. The
  // curl-classification diameter is not a biological local-radius bound.
  const tight = integrateHumanFaceHairCurve({
    ...props,
    layer: {
      ...layer,
      lengthAxes: [0.08, 0.08, 0.08, 0.08, 0.08, 0.08],
      curl: {
        mode: "helix",
        angle: 1.5,
        wavelength: 8 * layer.samplingStep,
        reach: 0.001,
      },
    },
  });
  TestValidator.predicate(
    "this unclipped curve retains the numerical turn convention",
    tight.points.slice(2).every((point, at) => {
      const before = Vector3.normalize(
        Vector3.subtract(tight.points[at + 1], tight.points[at]),
      );
      const after = Vector3.normalize(
        Vector3.subtract(point, tight.points[at + 1]),
      );
      return (
        Math.acos(Math.max(-1, Math.min(1, Vector3.dot(before, after)))) <=
        layer.samplingStep / 0.006 + 1e-9
      );
    }),
  );
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
  const emittedLaunchLength = Math.hypot(
    curve.points[1].x - props.root.x,
    curve.points[1].y - props.root.y,
    curve.points[1].z - props.root.z,
  );
  TestValidator.predicate(
    "an exact emitted launch leaves no metric tail",
    throwsError(
      () =>
        integrateHumanFaceHairCurve({
          ...props,
          budget: { remaining: 1_000_000 },
          layer: {
            ...layer,
            lengthAxes: new Array<number>(6).fill(emittedLaunchLength) as [
              number,
              number,
              number,
              number,
              number,
              number,
            ],
          },
        }),
      "rooted transition",
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
    buildHumanFaceHairMesh([], layer, {
      widths: [],
      query: props.query,
      ...props.meshContext,
      budgets: [],
      attachments: [],
    }).positions,
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
        { widths: [0.002], query: props.query, ...props.meshContext },
      ),
    ),
  );
  TestValidator.predicate(
    "unrepresentable ribbon width refuses",
    throwsError(() =>
      buildHumanFaceHairMesh([curve], layer, {
        widths: [Number.MIN_VALUE],
        query: props.query,
        ...props.meshContext,
      }),
    ),
  );
  TestValidator.predicate(
    "a station with no room for its ribbon refuses",
    throwsError(
      () =>
        buildHumanFaceHairMesh(
          [
            {
              ...curve,
              freeFrom: 1,
              points: [props.root, Vector3.create(1, 0.6, 0.5)],
            },
          ],
          layer,
          { widths: [0.002], query: props.query, ...props.meshContext },
        ),
      "too close to the surface",
    ),
  );
  TestValidator.predicate(
    "a ribbon without its own width refuses",
    throwsError(() =>
      buildHumanFaceHairMesh([curve], layer, {
        widths: [],
        query: props.query,
        ...props.meshContext,
      }),
    ),
  );
};
