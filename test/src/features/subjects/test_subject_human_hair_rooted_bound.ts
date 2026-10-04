import { Vector3 } from "@automovie/engine";
import {
  humanFaceHairContact,
  integrateHumanFaceHairCurve,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairCollider } from "../internal/createNumericalHairCollider";
import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { throwsError } from "../internal/predicates";

/**
 * An exterior gap too narrow for the retained construction turn cannot hide a
 * clipped, abrupt stem bend. The actual admitted origins expose realised chords.
 * Scenarios:
 * 1. A downward/leftward L wall bounds the first 3 mm ray to less than a step;
 *    later clipped trials must recompute their turn for the shorter travel.
 * 2. The unsupported narrow path refuses before attaining free clearance; every
 *    advanced prefix chord still respects its actual metric turn convention.
 * 3. A ray ending just outside the opposite wall has a clear midpoint but an
 *    endpoint inside the unchanged numerical allowance; no exterior endpoint
 *    can be admitted merely because the ray contains no earlier crossing.
 */
export const test_subject_human_hair_rooted_bound = (): void => {
  const root = Vector3.create(1.002, 1, 0.5);
  const collider = createNumericalHairCollider(
    createSignedVoxelUnion([
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ]),
    { triangle: 12, weights: [0.5, 0.498, 0.002] },
  );
  const layer = createNumericalHairFixture().layers[0];
  layer.samplingStep = 0.003;
  layer.flow = [-1, 0, 0];
  layer.lift.strength = 0.1;
  const contact = humanFaceHairContact({
    layer,
    root,
    length: 0.05,
    query: collider.query,
  });
  const origins: ReturnType<typeof Vector3.create>[] = [];
  const raycaster: typeof collider.raycaster = {
    ...collider.raycaster,
    nearestHit: (origin, direction, maximum, minimum) => {
      const point = Vector3.create(...(origin as [number, number, number]));
      const previous = origins[origins.length - 1];
      if (
        !previous ||
        previous.x !== point.x ||
        previous.y !== point.y ||
        previous.z !== point.z
      )
        origins.push(point);
      return collider.raycaster.nearestHit(origin, direction, maximum, minimum);
    },
  };
  let failure: unknown;
  try {
    integrateHumanFaceHairCurve({
      layer,
      root,
      reference: root,
      origin: Vector3.create(1.002, 0.9, 0.4),
      normal: Vector3.create(0, 1, 0),
      sequence: 1,
      ...collider,
      raycaster,
    });
  } catch (error: unknown) {
    failure = error;
  }
  const receipt = JSON.stringify({
    origins,
    failure: failure instanceof Error ? failure.message : failure,
  });
  TestValidator.predicate(
    "a narrow unsupported stem receives a numerical refusal: " + receipt,
    failure instanceof Error,
  );
  TestValidator.predicate(
    "the arrangement actually clips an advanced first chord: " + receipt,
    origins.length > 2 &&
      Vector3.length(Vector3.subtract(origins[1], origins[0])) <
        layer.samplingStep,
  );
  const chords = origins
    .slice(1)
    .map((point, at) => Vector3.subtract(point, origins[at]));
  for (let at = 1; at < chords.length; at++) {
    const length = Vector3.length(chords[at]);
    const turn = Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Vector3.dot(
            Vector3.normalize(chords[at - 1]),
            Vector3.normalize(chords[at]),
          ),
        ),
      ),
    );
    // The existing contact allowance bounds representable point subtraction.
    // Each normalized chord may rotate by asin(error/length); add both chord
    // errors when reading the angle between them. This is measurement precision,
    // not a relaxed construction scale or a caller clearance adjustment.
    const uncertainty =
      Math.asin(Math.min(1, contact.epsilon / length)) +
      Math.asin(Math.min(1, contact.epsilon / Vector3.length(chords[at - 1])));
    TestValidator.predicate(
      "short actual chords retain their construction turn rather than nominal-step turn",
      turn <= length / 0.006 + uncertainty,
    );
  }
  const endpointLayer = createNumericalHairFixture().layers[0];
  endpointLayer.flow = [-1, 0, 0];
  endpointLayer.lift.strength = 0;
  const endpointContact = humanFaceHairContact({
    layer: endpointLayer,
    root,
    length: 0.05,
    query: collider.query,
  });
  endpointLayer.samplingStep =
    (root.x - 1 - endpointContact.epsilon / 4) / Math.cos(Math.PI / 6);
  const along = Vector3.create(
    -Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), 0,
  );
  const endpoint = Vector3.add(
    root, Vector3.scale(along, endpointLayer.samplingStep),
  );
  const middle = Vector3.add(
    root, Vector3.scale(along, endpointLayer.samplingStep / 2),
  );
  TestValidator.predicate(
    "the independently arranged endpoint is exterior inside the original allowance",
    endpoint.x > 1 &&
      endpoint.x - 1 <= endpointContact.epsilon &&
      collider.query([middle.x, middle.y, middle.z]).signedDistance >
        endpointContact.epsilon,
  );
  TestValidator.predicate(
    "an unambiguous midpoint cannot admit the unsupported endpoint",
    throwsError(
      () =>
        integrateHumanFaceHairCurve({
          layer: endpointLayer,
          root,
          reference: root,
          origin: Vector3.create(1.002, 0.9, 0.4),
          normal: Vector3.create(0, 1, 0),
          sequence: 1,
          ...collider,
          budget: { remaining: 1_000_000 },
        }),
      "no admitted exterior endpoint",
    ),
  );
};
