import { Vector3 } from "@automovie/engine";
import { humanFaceHairContact } from "@automovie/human";
import { createHumanFaceHairExteriorInterval } from "@automovie/human/face/anatomy/hair/createHumanFaceHairExteriorInterval";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairCollider } from "../internal/createNumericalHairCollider";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { throwsError } from "../internal/predicates";

/**
 * A root-star prefix ending exactly at maximum supplies no exterior interval.
 * Scenarios:
 * 1. An admitted root 2^-47 below a box plane and a unit ray with y=2^-45
 *    intersect that original support at travel 1/4 exactly. The full prefix is
 *    within the existing allowance, but no distinct interior witness remains.
 * 2. The adjacent supported root on the same source diagonal has an outward
 *    2mm interval and a strictly positive midpoint, with owned point output.
 */
export const test_subject_human_hair_rooted_interval = (): void => {
  const collider = createNumericalHairCollider(
    createSignedVoxelUnion([[0, 0, 0]]),
    { triangle: 6, weights: [1, 0, 1] },
  );
  const root = Vector3.create(0.5, 1 - 2 ** -47, 0.5);
  const contact = humanFaceHairContact({
    layer: { samplingStep: 0.002, clearance: 0.001 },
    root,
    length: 0.25,
    query: collider.query,
  });
  TestValidator.predicate(
    "the arranged root is within the existing surface allowance",
    Math.abs(contact.sample(root).signedDistance) <= contact.epsilon,
  );
  const direction = Vector3.create(1, 2 ** -45, 0);
  const hit = collider.raycaster.nearestHit(
    [root.x, root.y, root.z],
    [direction.x, direction.y, direction.z],
    0.25,
  );
  TestValidator.predicate(
    "actual root-star hit is exactly the requested maximum",
    hit !== null &&
      hit.distance === 0.25 &&
      collider.rootBoundary.triangles.includes(hit.triangle),
  );
  TestValidator.predicate(
    "a complete numeric prefix cannot substitute an exterior witness",
    throwsError(
      () =>
        createHumanFaceHairExteriorInterval({
          root,
          direction,
          maximum: 0.25,
          originOnSkin: true,
          contact,
          ...collider,
          budget: { remaining: 1_000_000 },
        }),
      "no representable exterior interval",
    ),
  );
  const supportedRoot = Vector3.create(0.5, 1, 0.5);
  const supportedContact = humanFaceHairContact({
    layer: { samplingStep: 0.002, clearance: 0.001 },
    root: supportedRoot,
    length: 0.05,
    query: collider.query,
  });
  const interval = createHumanFaceHairExteriorInterval({
    root: supportedRoot,
    direction: Vector3.create(0, 1, 0),
    maximum: 0.002,
    originOnSkin: true,
    contact: supportedContact,
    ...collider,
    budget: { remaining: 1_000_000 },
  });
  TestValidator.predicate(
    "adjacent supported interval remains exterior",
    interval.bound === 0.002 &&
      !interval.bounded &&
      interval.pointAt(0.001).y > 1,
  );
  const point = interval.pointAt(0.001);
  point.y = 5;
  TestValidator.predicate(
    "interval point output remains independently owned",
    interval.pointAt(0.001).y < 2,
  );
};
