import { TestValidator } from "@nestia/e2e";

import {
  faceLikenessRegionUnion,
  planFaceLikenessFrame,
} from "../../../scripts/face-review/faceLikenessFraming";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A frame capture sized to hold the photograph's hair and head region.
 * Scenarios:
 * 1. With the identity similarity, a region equal to the whole 900 px render
 *    keeps the direction and target and scales the 0.62 m distance by the
 *    10% margin; the same region at zero margin reproduces the camera.
 * 2. A region of the render's right half at yaw 0 moves the target +x by a
 *    quarter of the plane width and needs half the distance at zero margin;
 *    at yaw 90 the screen right is world -z, so the target moves along -z.
 * 3. A region of the upper half at pitch 30 moves the target along the
 *    pitched screen up vector (-sin p sin y, cos p, -sin p cos y).
 * 4. A photograph twice the render's scale (similarity scale 2) halves the
 *    distance needed for the same photograph region.
 * 5. A negative margin or an empty region refuses; the union of regions is
 *    their joint bounds and an empty union refuses.
 */
export const test_subject_face_likeness_framing = (): void => {
  const camera = {
    yaw: 0,
    pitch: 0,
    distance: 0.62,
    target: [0, 0, 0.06] as [number, number, number],
  };
  const identity = { a: 1, b: 0, tx: 0, ty: 0 };
  const plane = 2 * 0.62 * Math.tan((14 * Math.PI) / 180);
  const plan = (props: Partial<Parameters<typeof planFaceLikenessFrame>[0]>) =>
    planFaceLikenessFrame({
      camera,
      renderToReference: identity,
      region: { x0: 0, y0: 0, x1: 900, y1: 900 },
      viewport: 900,
      fovDegrees: 28,
      margin: 0,
      ...props,
    });
  const whole = plan({ margin: 0.1 });
  TestValidator.predicate("margin distance", nclose(whole.distance, 0.682));
  TestValidator.equals("direction kept", [whole.yaw, whole.pitch], [0, 0]);
  TestValidator.predicate(
    "target kept",
    nclose(whole.target[0], 0) &&
      nclose(whole.target[1], 0) &&
      nclose(whole.target[2], 0.06),
  );
  TestValidator.predicate("same camera", nclose(plan({}).distance, 0.62));

  const half = plan({ region: { x0: 450, y0: 0, x1: 900, y1: 450 } });
  TestValidator.predicate("half distance", nclose(half.distance, 0.31));
  TestValidator.predicate(
    "target right and up",
    nclose(half.target[0], plane / 4) &&
      nclose(half.target[1], plane / 4) &&
      nclose(half.target[2], 0.06),
  );
  const side = plan({
    camera: { ...camera, yaw: 90 },
    region: { x0: 450, y0: 225, x1: 900, y1: 675 },
  });
  TestValidator.predicate(
    "yaw 90 right is -z",
    nclose(side.target[0], 0) &&
      nclose(side.target[1], 0) &&
      nclose(side.target[2], 0.06 - plane / 4),
  );
  const pitch = (30 * Math.PI) / 180;
  const up = plan({
    camera: { ...camera, pitch: 30 },
    region: { x0: 225, y0: 0, x1: 675, y1: 450 },
  });
  TestValidator.predicate(
    "pitched up vector",
    nclose(up.target[0], 0) &&
      nclose(up.target[1], (plane / 4) * Math.cos(pitch)) &&
      nclose(up.target[2], 0.06 - (plane / 4) * Math.sin(pitch)),
  );
  const scaled = plan({
    renderToReference: { a: 2, b: 0, tx: 0, ty: 0 },
    region: { x0: 0, y0: 0, x1: 1800, y1: 900 },
  });
  TestValidator.predicate("scaled photograph", nclose(scaled.distance, 0.62));

  TestValidator.predicate(
    "negative margin",
    throwsError(() => plan({ margin: -0.1 }), "non-negative"),
  );
  TestValidator.predicate(
    "empty region",
    throwsError(
      () => plan({ region: { x0: 5, y0: 0, x1: 5, y1: 9 } }),
      "positive area",
    ),
  );
  TestValidator.equals(
    "union",
    faceLikenessRegionUnion([
      { x0: 1, y0: 5, x1: 3, y1: 9 },
      { x0: 0, y0: 6, x1: 4, y1: 7 },
    ]),
    { x0: 0, y0: 5, x1: 4, y1: 9 },
  );
  TestValidator.predicate(
    "empty union",
    throwsError(() => faceLikenessRegionUnion([]), "No regions"),
  );
};
