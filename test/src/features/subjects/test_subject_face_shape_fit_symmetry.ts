import { TestValidator } from "@nestia/e2e";

import {
  faceShapeFitAsymmetry,
  faceShapeFitMirror,
} from "../../../scripts/face-review/faceShapeFitSymmetry";
import { nclose } from "../internal/predicates";

/**
 * Mirror partners and the asymmetry of a displacement field.
 * Scenarios:
 * 1. Four vertices at x = -2, -1, 1, 2 pair as (0, 3) and (1, 2); a vertex
 *    on the midline is its own partner; a vertex whose mirror image is far
 *    from any other is still paired by widening the search; no positions
 *    give no partners.
 * 2. A field moving both sides outward by the same amount is symmetric (0);
 *    moving both by +x is a lateral slide (2); moving one side only gives
 *    sqrt(2); no rows give 0.
 */
export const test_subject_face_shape_fit_symmetry = (): void => {
  const positions = [-2, 0, 0, -1, 0, 0, 1, 0, 0, 2, 0, 0];
  const mirror = faceShapeFitMirror(positions);
  TestValidator.equals("pairs", mirror, [3, 2, 1, 0]);
  TestValidator.equals(
    "midline",
    faceShapeFitMirror([0, 1, 0, 5, 1, 0, -5, 1, 0]),
    [0, 2, 1],
  );
  // The mirror image (-2, 0, 0) of vertex 1 lies far from vertex 0 at the
  // origin relative to the grid built on an extent of 64.
  TestValidator.equals(
    "widened search",
    faceShapeFitMirror([0, 0, 0, 2, 0, 0, 64, 0, 0])[1],
    0,
  );
  TestValidator.equals("empty", faceShapeFitMirror([]), []);

  const outward = [0, -1, 0, 0, 3, 1, 0, 0];
  TestValidator.predicate(
    "symmetric",
    nclose(faceShapeFitAsymmetry(outward, mirror), 0),
  );
  const slide = [0, 1, 0, 0, 3, 1, 0, 0];
  TestValidator.predicate(
    "lateral slide",
    nclose(faceShapeFitAsymmetry(slide, mirror), 2),
  );
  const oneSide = [3, 1, 0, 0];
  TestValidator.predicate(
    "one side",
    nclose(faceShapeFitAsymmetry(oneSide, mirror), Math.SQRT2),
  );
  TestValidator.equals("no rows", faceShapeFitAsymmetry([], mirror), 0);
};
