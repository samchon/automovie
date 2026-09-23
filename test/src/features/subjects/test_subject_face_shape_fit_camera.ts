import { TestValidator } from "@nestia/e2e";

import {
  faceShapeFitProject,
  faceShapeFitRay,
  faceShapeFitView,
} from "../../../scripts/face-review/faceShapeFitCamera";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The capture camera as a pure projection and ray.
 * Scenarios:
 * 1. The front camera (0.62 m, target (0, 0, 0.06)) projects its target to
 *    the image centre, and a point 0.1 m to the right on the target plane to
 *    450 + 450 * 0.1 / (0.62 tan 14 degrees) pixels; +Y goes up the image.
 * 2. A camera turned 90 degrees of yaw looks along -X, so world -Z is image
 *    right.
 * 3. Every pixel's ray, followed any distance, projects back to that pixel,
 *    also for a pitched and yawed camera.
 * 4. A point behind the camera refuses.
 */
export const test_subject_face_shape_fit_camera = (): void => {
  const front = faceShapeFitView({
    yaw: 0,
    pitch: 0,
    distance: 0.62,
    target: [0, 0, 0.06],
  });
  const centre = faceShapeFitProject(front, [0, 0, 0.06]);
  TestValidator.predicate(
    "target at centre",
    nclose(centre[0], 450) && nclose(centre[1], 450),
  );
  const right = faceShapeFitProject(front, [0.1, 0, 0.06]);
  const expected = 450 + (450 * 0.1) / (0.62 * Math.tan((14 * Math.PI) / 180));
  TestValidator.predicate(
    "right on the target plane",
    nclose(right[0], expected, 1e-6) && nclose(right[1], 450),
  );
  TestValidator.predicate(
    "up is up",
    faceShapeFitProject(front, [0, 0.05, 0.06])[1] < 450,
  );
  const side = faceShapeFitView({
    yaw: 90,
    pitch: 0,
    distance: 0.62,
    target: [0, 0, 0],
  });
  TestValidator.predicate(
    "yaw 90 right is -Z",
    faceShapeFitProject(side, [0, 0, -0.05])[0] > 450,
  );
  const tilted = faceShapeFitView(
    { yaw: -30, pitch: 12, distance: 0.8, target: [0.01, -0.02, 0.05] },
    640,
    35,
  );
  for (const pixel of [
    [10, 20],
    [320, 320],
    [600, 100],
  ] as [number, number][]) {
    const ray = faceShapeFitRay(tilted, pixel);
    for (const t of [0.3, 1.1]) {
      const back = faceShapeFitProject(
        tilted,
        ray.origin.map((value, k) => value + t * ray.direction[k]!),
      );
      TestValidator.predicate(
        "ray round trip",
        nclose(back[0], pixel[0], 1e-6) && nclose(back[1], pixel[1], 1e-6),
      );
    }
  }
  TestValidator.predicate(
    "behind the camera",
    throwsError(
      () => faceShapeFitProject(front, [0, 0, 1]),
      "in front of the camera",
    ),
  );
};
