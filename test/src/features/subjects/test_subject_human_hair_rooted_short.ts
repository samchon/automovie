import { Vector3 } from "@automovie/engine";
import {
  humanFaceHairContact,
  integrateHumanFaceHairCurve,
} from "@automovie/human";
import { launchHumanFaceHairCurve } from "@automovie/human/face/anatomy/hair/launchHumanFaceHairCurve";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairCollider } from "../internal/createNumericalHairCollider";
import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A short supported lock separates initial tangent from finite free clearance.
 * Scenarios:
 * 1. A 15-degree straight ray needs 1.5mm/sin(15deg)>5mm and refuses, pinning
 *    the former consumer assumption without changing the immutable query.
 * 2. Two 2mm stem chords, with the existing 2mm/6mm numerical turn, reach
 *    2mm*(sin(15deg)+sin(15deg+1/3))>1.5mm and complete the authored 5mm lock.
 *    The initial chord remains 15 degrees and every point is outside y=1.
 */
export const test_subject_human_hair_rooted_short = (): void => {
  const layer = createNumericalHairFixture().layers[0];
  layer.flow = [1, 0, 0];
  layer.lift.strength = 0;
  layer.clearance = 0.0005;
  layer.lengthAxes = [0.005, 0.005, 0.005, 0.005, 0.005, 0.005];
  layer.hairline = {
    front: Math.PI / 4,
    back: Math.PI / 4,
    left: Math.PI / 4,
    right: Math.PI / 4,
  };
  const root = Vector3.create(0.5, 1, 0.5);
  const normal = Vector3.create(0, 1, 0);
  const collider = createNumericalHairCollider(
    createSignedVoxelUnion([[0, 0, 0]]),
    { triangle: 6, weights: [1, 0, 1] },
  );
  const angle = Math.PI / 12;
  const direction = Vector3.create(Math.cos(angle), Math.sin(angle), 0);
  const contact = humanFaceHairContact({
    layer,
    root,
    length: 0.005,
    query: collider.query,
  });
  TestValidator.predicate(
    "the strict straight-ray premise cannot fit this length",
    throwsError(
      () =>
        launchHumanFaceHairCurve({
          root,
          exitDirection: direction,
          length: 0.005,
          contact,
          raycaster: collider.raycaster,
          rootBoundary: collider.rootBoundary,
          budget: { remaining: 1_000_000 },
        }),
      "blocks its emergence clearance",
    ),
  );
  const curve = integrateHumanFaceHairCurve({
    layer,
    root,
    normal,
    reference: root,
    origin: Vector3.create(0.5, 0.9, 0.4),
    sequence: 1,
    ...collider,
  });
  const first = Vector3.subtract(curve.points[1], root);
  TestValidator.predicate(
    "actual initial chord retains fifteen degrees",
    nclose(Math.atan2(first.y, first.x), angle, 1e-11),
  );
  const independentGap = 0.002 * (Math.sin(angle) + Math.sin(angle + 1 / 3));
  TestValidator.predicate(
    "the second stem chord reaches the independently calculated free gap",
    curve.freeFrom === 2 &&
      nclose(curve.points[2].y - 1, independentGap, 1e-11) &&
      independentGap > 0.0015,
  );
  const measured = curve.points
    .slice(1)
    .reduce(
      (sum, point, at) =>
        sum + Vector3.length(Vector3.subtract(point, curve.points[at])),
      0,
    );
  TestValidator.predicate(
    "stem and remainder share the exact short metric and stay exterior",
    nclose(measured, 0.005, 1e-11) &&
      curve.points.every((point) => point.y >= 1),
  );
};
