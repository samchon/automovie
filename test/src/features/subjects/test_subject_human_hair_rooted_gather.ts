import { Vector3 } from "@automovie/engine";
import { integrateHumanFaceHairCurve } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairCollider } from "../internal/createNumericalHairCollider";
import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, vclose } from "../internal/predicates";

/**
 * A tie crossed during the rooted stem is entered at its actual metric event.
 * Scenarios:
 * 1. A 30-degree initial ray crosses a 0.1 mm sphere before its first nominal
 *    2 mm station; the emitted crossing is 0.9 mm from the root and on the tie.
 * 2. The stem retains that event, reaches full clearance, then grows the +Z tail
 *    with its real consumed prefix included in the complete 50 mm metric.
 */
export const test_subject_human_hair_rooted_gather = (): void => {
  const root = Vector3.create(1, 0.5, 0.5);
  const direction = Vector3.create(0.5, Math.sqrt(3) / 2, 0);
  const anchor = Vector3.add(root, Vector3.scale(direction, 0.001));
  const layer = createNumericalHairFixture().layers[0];
  layer.flow = [0, 1, 0];
  layer.lift.strength = 0;
  layer.gather = {
    anchor: { polar: Math.PI / 2, azimuth: Math.PI / 2 },
    radius: 0.0001,
    strength: 1,
    tail: { direction: [0, 0, 1] },
  };
  const collider = createNumericalHairCollider(
    createSignedVoxelUnion([[0, 0, 0]]),
    { triangle: 2, weights: [1, 0, 1] },
  );
  const curve = integrateHumanFaceHairCurve({
    layer,
    root,
    reference: root,
    origin: Vector3.create(),
    normal: Vector3.create(1, 0, 0),
    sequence: 1,
    ...collider,
    gatherAnchor: anchor,
    gatherDirection: () => Vector3.create(0, 1, 0),
  });
  const first = curve.points[1];
  TestValidator.predicate(
    "rooted crossing retains the independently known event",
    vclose(first, Vector3.add(root, Vector3.scale(direction, 0.0009)), 1e-11) &&
      nclose(Vector3.length(Vector3.subtract(first, anchor)), 0.0001, 1e-11),
  );
  TestValidator.predicate(
    "the crossing precedes free clearance and tail completion",
    curve.freeFrom > 1 &&
      curve.points[curve.points.length - 1].z > root.z + 0.02,
  );
  const length = curve.points
    .slice(1)
    .reduce(
      (sum, point, at) =>
        sum + Vector3.length(Vector3.subtract(point, curve.points[at])),
      0,
    );
  TestValidator.predicate(
    "prefix, tie event and tail share one total metric",
    nclose(length, 0.05, 1e-11),
  );
};
