import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  faceShapeFitAnchorPoint,
  faceShapeFitSurfacePositions,
  raycastFaceShapeFitSurface,
} from "../../../scripts/face-review/faceShapeFitSurface";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Landmark anchors on a basis surface and their built positions.
 * Scenarios:
 * 1. On the analytic square basis, the built model's two region parts give
 *    back the surface's four vertex positions, before and after a shape
 *    edit that widens vertices 1 and 2 by 0.5.
 * 2. A ray down -Z through (0.25, 0.75) hits the square's second triangle
 *    (0, 2, 3) at distance 1 with weights reproducing that point; a ray
 *    through (2, 2) misses; a ray parallel to the plane misses; the nearer
 *    of two stacked hits wins.
 * 3. A model without a region part and an unknown surface refuse.
 */
export const test_subject_face_shape_fit_surface = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const neutral = faceShapeFitSurfacePositions(
    basis,
    build({ ...document, shape: {}, expression: {} }),
    "square",
  );
  TestValidator.equals(
    "neutral positions",
    neutral,
    basis.surfaces[0]!.positions,
  );
  const wide = faceShapeFitSurfacePositions(
    basis,
    build({ ...document, shape: { width: 1 }, expression: {} }),
    "square",
  );
  TestValidator.equals(
    "widened positions",
    wide,
    [0, 0, 0, 1.5, 0, 0, 1.5, 1, 0, 0, 1, 0],
  );

  const square = basis.surfaces[0]!;
  const hit = raycastFaceShapeFitSurface(square.positions, square.indices, {
    origin: [0.25, 0.75, 1],
    direction: [0, 0, -1],
  })!;
  TestValidator.equals("second triangle", hit.vertices, [0, 2, 3]);
  TestValidator.predicate("distance", nclose(hit.distance, 1));
  const point = faceShapeFitAnchorPoint(square.positions, hit);
  TestValidator.predicate(
    "anchored point",
    nclose(point[0], 0.25) && nclose(point[1], 0.75) && nclose(point[2], 0),
  );
  TestValidator.equals(
    "miss",
    raycastFaceShapeFitSurface(square.positions, square.indices, {
      origin: [2, 2, 1],
      direction: [0, 0, -1],
    }),
    null,
  );
  TestValidator.equals(
    "parallel",
    raycastFaceShapeFitSurface(square.positions, square.indices, {
      origin: [0.5, 0.5, 1],
      direction: [1, 0, 0],
    }),
    null,
  );
  const stacked = [
    ...square.positions,
    ...square.positions.map((value, k) => (k % 3 === 2 ? 0.5 : value)),
  ];
  const both = [...square.indices, ...square.indices.map((index) => index + 4)];
  TestValidator.predicate(
    "nearer hit wins",
    nclose(
      raycastFaceShapeFitSurface(stacked, both, {
        origin: [0.25, 0.75, 1],
        direction: [0, 0, -1],
      })!.distance,
      0.5,
    ),
  );
  TestValidator.predicate(
    "behind the origin is not a hit",
    raycastFaceShapeFitSurface(square.positions, square.indices, {
      origin: [0.25, 0.75, -1],
      direction: [0, 0, -1],
    }) === null,
  );

  const model = build({ ...document, shape: {}, expression: {} });
  TestValidator.predicate(
    "missing region part",
    throwsError(
      () =>
        faceShapeFitSurfacePositions(
          basis,
          { ...model, parts: model.parts.slice(1) },
          "square",
        ),
      "lacks the region",
    ),
  );
  TestValidator.predicate(
    "unknown surface",
    throwsError(
      () => faceShapeFitSurfacePositions(basis, model, "absent"),
      "No basis surface",
    ),
  );
};
