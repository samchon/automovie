import { Vector3 } from "@automovie/engine";
import { evaluateHumanFaceHairDirection } from "@automovie/human/face/anatomy/hair/evaluateHumanFaceHairDirection";
import { humanFaceHairFrame } from "@automovie/human/face/anatomy/hair/humanFaceHairFrame";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Static fields have deterministic directions and explicit singularities.
 * Scenarios:
 * 1. Zero curl/lift follows the authored flow; wave and helix preserve unit norm.
 * 2. A signed part plane gives opposite lateral directions on opposite roots;
 *    a remote Gaussian envelope removes its influence without moving the root.
 * 3. Parallel and independent frame references remain perpendicular/unit length.
 * 4. Cancelled and nonfinite fields refuse; finite lift resolves inward-only flow.
 */
export const test_subject_human_numerical_hair_field = (): void => {
  const layer = createNumericalHairFixture().layers[0];
  layer.flow = [0, 0, 1];
  layer.lift.strength = 0;
  const props = {
    layer,
    root: Vector3.create(0, 0.1, 0),
    normal: Vector3.create(0, 1, 0),
    distance: 0.02,
    phase: 0.7,
  };
  TestValidator.predicate(
    "zero modulation",
    vclose(evaluateHumanFaceHairDirection(props), Vector3.create(0, 0, 1)),
  );
  for (const mode of ["wave", "helix"] as const) {
    layer.curl = { ...layer.curl, mode, angle: 0.4 };
    const result = evaluateHumanFaceHairDirection(props);
    TestValidator.predicate(
      "curl unit length",
      nclose(Vector3.length(result), 1),
    );
    TestValidator.predicate(
      "curl actually changes direction",
      Math.abs(result.x) + Math.abs(result.y) > 0,
    );
  }
  layer.curl.angle = 0;
  layer.part = {
    normal: [2, 0, 0],
    offset: 0,
    transitionWidth: 0.005,
    bias: [0, 0, 0],
    strength: 2,
    reach: 1,
  };
  const left = evaluateHumanFaceHairDirection({
    ...props,
    root: Vector3.create(0.1, 0.1, 0),
  });
  const right = evaluateHumanFaceHairDirection({
    ...props,
    root: Vector3.create(-0.1, 0.1, 0),
  });
  TestValidator.predicate(
    "part plane symmetry",
    left.x > 0 && nclose(left.x, -right.x) && nclose(left.z, right.z),
  );
  layer.part.region = { center: [100, 100, 100], spread: [0.01, 0.01, 0.01] };
  TestValidator.predicate(
    "remote envelope",
    vclose(evaluateHumanFaceHairDirection(props), Vector3.create(0, 0, 1)),
  );
  for (const reference of [Vector3.create(0, 1, 0), Vector3.create(0, 0, 1)]) {
    const axis = Vector3.create(0, 1, 0),
      frame = humanFaceHairFrame.perpendicular(axis, reference);
    TestValidator.predicate(
      "transverse frame",
      nclose(Vector3.dot(axis, frame), 0) && nclose(Vector3.length(frame), 1),
    );
  }
  delete layer.part;
  layer.flow = [0, -1, 0];
  TestValidator.predicate(
    "cancelled direction refuses",
    throwsError(() => evaluateHumanFaceHairDirection(props)),
  );
  layer.lift.strength = 0.1;
  TestValidator.predicate(
    "authored lift resolves direction",
    vclose(evaluateHumanFaceHairDirection(props), props.normal),
  );
  TestValidator.predicate(
    "nonfinite direction refuses",
    throwsError(() =>
      humanFaceHairFrame.direction(Vector3.create(Infinity, 0, 0)),
    ),
  );
};
