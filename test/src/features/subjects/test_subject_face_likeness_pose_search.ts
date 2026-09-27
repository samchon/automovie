import { TestValidator } from "@nestia/e2e";

import {
  FACE_LIKENESS_SILHOUETTE,
  faceLikenessSimilarityResidual,
  searchFaceLikenessPose,
} from "../../../scripts/face-review/faceLikenessPoseSearch";
import {
  faceShapeFitProject,
  faceShapeFitView,
} from "../../../scripts/face-review/faceShapeFitCamera";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A photograph's camera direction by landmark reprojection.
 * Scenarios:
 * 1. The similarity residual is zero for a rotated, scaled and moved copy,
 *    and for a unit square against a 2 by 1 rectangle it is
 *    sqrt((20 - 12^2 / 8) / 20); fewer than three pairs, unequal lists and
 *    points without spread refuse.
 * 2. Points of a head-sized cloud photographed at yaw 7 and pitch -4 (then
 *    turned, scaled and moved in the image) are found from a zero pose on a
 *    1 degree grid within 10, with no residual left beyond rounding, where
 *    the zero pose
 *    leaves some; a step that is not positive or exceeds the span refuses.
 * 3. The silhouette list is the detector's 36 face-oval landmarks.
 */
export const test_subject_face_likeness_pose_search = (): void => {
  const square: [number, number][] = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ];
  const turned = square.map(
    ([x, y]) =>
      [
        3 * (Math.cos(0.4) * x - Math.sin(0.4) * y) + 5,
        3 * (Math.sin(0.4) * x + Math.cos(0.4) * y) - 2,
      ] as [number, number],
  );
  const rectangle = square.map(([x, y]) => [2 * x, y] as [number, number]);
  TestValidator.predicate(
    "similarity residual",
    nclose(faceLikenessSimilarityResidual(turned, square), 0, 1e-12) &&
      nclose(
        faceLikenessSimilarityResidual(square, rectangle),
        Math.sqrt((20 - 144 / 8) / 20),
        1e-12,
      ) &&
      throwsError(
        () => faceLikenessSimilarityResidual(square.slice(0, 2), square),
        "three or more",
      ) &&
      throwsError(
        () => faceLikenessSimilarityResidual(square, rectangle.slice(1)),
        "three or more",
      ) &&
      throwsError(
        () =>
          faceLikenessSimilarityResidual(
            [
              [1, 1],
              [1, 1],
              [1, 1],
            ],
            square.slice(1),
          ),
        "spread",
      ),
  );

  const cloud: [number, number, number][] = [];
  for (const x of [-0.06, -0.02, 0.02, 0.06])
    for (const y of [-0.08, -0.03, 0.02, 0.07])
      cloud.push([x, y, 0.1 - 8 * x * x - 4 * y * y]);
  const pose = {
    yaw: 0,
    pitch: 0,
    distance: 0.62,
    target: [0, 0, 0.06] as [number, number, number],
  };
  const view = faceShapeFitView({ ...pose, yaw: 7, pitch: -4 });
  const photo = cloud.map((point) => {
    const [x, y] = faceShapeFitProject(view, point);
    return [0.8 * x - 0.1 * y + 40, 0.1 * x + 0.8 * y - 30] as [number, number];
  });
  const found = searchFaceLikenessPose({
    model: cloud,
    photo,
    pose,
    span: 10,
    step: 1,
  });
  TestValidator.predicate(
    "reprojection",
    nclose(found.yaw, 7, 1e-9) &&
      nclose(found.pitch, -4, 1e-9) &&
      found.residual < 1e-6 &&
      found.before > 1e-3,
  );
  TestValidator.predicate(
    "step refusals",
    throwsError(
      () =>
        searchFaceLikenessPose({
          model: cloud,
          photo,
          pose,
          span: 10,
          step: 0,
        }),
      "positive step",
    ) &&
      throwsError(
        () =>
          searchFaceLikenessPose({
            model: cloud,
            photo,
            pose,
            span: 1,
            step: 2,
          }),
        "positive step",
      ),
  );
  TestValidator.predicate(
    "silhouette",
    FACE_LIKENESS_SILHOUETTE.length === 36 &&
      new Set(FACE_LIKENESS_SILHOUETTE).size === 36,
  );
};
