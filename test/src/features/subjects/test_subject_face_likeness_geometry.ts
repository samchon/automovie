import { TestValidator } from "@nestia/e2e";

import {
  FACE_LIKENESS_ALIGNMENT_POINTS,
  type FaceLikenessPoint,
  applyFaceLikenessSimilarity,
  faceLikenessEyeAperture,
  faceLikenessInterocular,
  faceLikenessLandmarkResidual,
  faceLikenessMedian,
  faceLikenessMouthCornerLift,
  fitFaceLikenessSimilarity,
  invertFaceLikenessSimilarity,
} from "../../../scripts/face-review/faceLikenessGeometry";
import { createFaceLikenessLandmarks } from "../internal/createFaceLikenessFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Landmark alignment and the scale-free lid and lip signals.
 * Scenarios:
 * 1. Points moved by a known similarity (scale 2, 30 degrees, shift) are
 *    fitted back to that exact similarity; its inverse returns every point
 *    and composing the two is the identity. The caller's points are unchanged.
 * 2. Identical faces have zero residual; shifting every mesh point of one
 *    face vertically by 4 px while the alignment points stay put gives a
 *    residual of 4/40 = 0.1 inter-ocular on the shifted points.
 * 3. The hand-built eyes open 0.4 and 0.3 of their width and the mouth
 *    corners lift 4/30 of mouth width; a corner below the centre is negative.
 * 4. Two selected points are enough, fewer refuse; coincident points and a
 *    missing landmark refuse; a zero-scale similarity has no inverse and
 *    coincident reference eyes have no residual scale.
 * 5. The median handles odd, even and empty lists without reordering input.
 */
export const test_subject_face_likeness_geometry = (): void => {
  const fixed = createFaceLikenessLandmarks();
  const angle = Math.PI / 6;
  const known = {
    a: 2 * Math.cos(angle),
    b: 2 * Math.sin(angle),
    tx: 7,
    ty: -3,
  };
  const inverse = invertFaceLikenessSimilarity(known);
  const moving = fixed.map((point) =>
    applyFaceLikenessSimilarity(inverse, point),
  );
  const before = JSON.stringify(moving);
  const fitted = fitFaceLikenessSimilarity(moving, fixed);
  TestValidator.predicate(
    "known similarity recovered",
    nclose(fitted.a, known.a) &&
      nclose(fitted.b, known.b) &&
      nclose(fitted.tx, known.tx) &&
      nclose(fitted.ty, known.ty),
  );
  TestValidator.equals("points untouched", JSON.stringify(moving), before);
  const round = applyFaceLikenessSimilarity(fitted, moving[33]!);
  TestValidator.predicate(
    "moving point lands on fixed point",
    nclose(round[0], fixed[33]![0]) && nclose(round[1], fixed[33]![1]),
  );
  const identity = invertFaceLikenessSimilarity(
    invertFaceLikenessSimilarity(known),
  );
  TestValidator.predicate(
    "double inverse is the original",
    nclose(identity.a, known.a) &&
      nclose(identity.b, known.b) &&
      nclose(identity.tx, 7) &&
      nclose(identity.ty, -3),
  );

  const zero = faceLikenessLandmarkResidual(
    fixed,
    fixed,
    fitFaceLikenessSimilarity(fixed, fixed),
  );
  TestValidator.predicate(
    "identical faces",
    nclose(zero.rms, 0) && nclose(zero.median, 0),
  );
  const alignment = new Set<number>(FACE_LIKENESS_ALIGNMENT_POINTS);
  const shifted: FaceLikenessPoint[] = fixed.map((point, index) =>
    index < 468 && !alignment.has(index) ? [point[0], point[1] + 4] : point,
  );
  const residual = faceLikenessLandmarkResidual(
    shifted,
    fixed,
    fitFaceLikenessSimilarity(shifted, fixed),
  );
  const expectedRms = 0.1 * Math.sqrt((468 - 8) / 468);
  TestValidator.predicate(
    "shifted mesh residual",
    nclose(residual.rms, expectedRms) && nclose(residual.median, 0.1),
  );
  TestValidator.predicate(
    "inter-ocular",
    nclose(faceLikenessInterocular(fixed), 40),
  );

  TestValidator.predicate(
    "right aperture",
    nclose(faceLikenessEyeAperture(fixed, "right"), 0.4),
  );
  TestValidator.predicate(
    "left aperture",
    nclose(faceLikenessEyeAperture(fixed, "left"), 0.3),
  );
  TestValidator.predicate(
    "corner lift",
    nclose(faceLikenessMouthCornerLift(fixed), 4 / 30),
  );
  const frown = fixed.map(
    (point, index): FaceLikenessPoint =>
      index === 61 || index === 291 ? [point[0], 190] : point,
  );
  TestValidator.predicate(
    "corners below centre",
    nclose(faceLikenessMouthCornerLift(frown), -6 / 30),
  );

  TestValidator.predicate(
    "two points suffice",
    nclose(fitFaceLikenessSimilarity(fixed, fixed, [33, 263]).a, 1),
  );
  TestValidator.predicate(
    "one point refuses",
    throwsError(
      () => fitFaceLikenessSimilarity(fixed, fixed, [33]),
      "at least two",
    ),
  );
  const collapsed: FaceLikenessPoint[] = fixed.map(() => [5, 5]);
  TestValidator.predicate(
    "coincident points refuse",
    throwsError(
      () => fitFaceLikenessSimilarity(collapsed, fixed),
      "degenerate",
    ),
  );
  TestValidator.predicate(
    "missing landmark refuses",
    throwsError(
      () => fitFaceLikenessSimilarity(fixed.slice(0, 100), fixed),
      "Landmark 133",
    ),
  );
  TestValidator.predicate(
    "zero scale has no inverse",
    throwsError(
      () => invertFaceLikenessSimilarity({ a: 0, b: 0, tx: 1, ty: 1 }),
      "no inverse",
    ),
  );
  TestValidator.predicate(
    "coincident reference eyes",
    throwsError(
      () =>
        faceLikenessLandmarkResidual(fixed, collapsed, {
          a: 1,
          b: 0,
          tx: 0,
          ty: 0,
        }),
      "coincide",
    ),
  );

  const values = [3, 1, 2];
  TestValidator.equals("odd median", faceLikenessMedian(values), 2);
  TestValidator.equals("input order kept", values, [3, 1, 2]);
  TestValidator.equals("even median", faceLikenessMedian([4, 1, 3, 2]), 2.5);
  TestValidator.equals("empty median", faceLikenessMedian([]), null);
};
