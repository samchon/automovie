import {
  humanBodyShoulderElevationLimit,
  humanBodyShoulderReaches,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The humeral joint sinus admits a goal by its direction's plane maximum and
 * its axial range, never by plane and elevation as independent limits.
 *
 * Scenarios, against the clinical table `(-180, 10) (-90, 60) (-45, 90)
 * (0, 180) (90, 180) (135, 90)` with hand-interpolated oracles:
 *
 * 1. Each knot returns its own maximum, and a plane between two knots the
 *    linear value (-67.5 gives 75, 112.5 gives 135).
 * 2. The seam from 135 to -180 + 360 is one segment: 157.5 gives 50, and
 *    -180 is the knot itself. A plane outside [-180, 180) reads the same
 *    point one period away, which is what the periodic plane means.
 * 3. A plane before the first knot reads the seam from the last knot, which
 *    a table whose first knot is not -180 exercises (-120 on a table from
 *    -90 reads (135, 90) to (270, 60) at 240: 90 - 30 * 105 / 135).
 * 4. Reach: extension 60 in the posterior plane admits and 60.5 refuses; the
 *    arm carried horizontally through the chest (plane 180 is -180,
 *    elevation 90) refuses; the functional positions Pearl et al. 1992
 *    measured (cross-body 124/90, maximum extension -88/55, reaching the
 *    perineum -86/38) admit.
 * 5. Poles: elevation 0 admits in every plane; elevation 180 admits in the
 *    posterior plane too, because overhead has no plane, and refuses when no
 *    knot reaches 180.
 * 6. Axial rotation and total elevation keep their own ranges, and a
 *    non-finite number refuses.
 */
export const test_human_body_shoulder_reach = (): void => {
  const range = {
    elevation: { min: 0, max: 180 },
    axialRotation: { min: -90, max: 70 },
    envelope: [
      [-180, 10],
      [-90, 60],
      [-45, 90],
      [0, 180],
      [90, 180],
      [135, 90],
    ] as [number, number][],
  };
  const limit = (plane: number): number =>
    humanBodyShoulderElevationLimit(range, plane);
  for (const [plane, expected] of [
    [-180, 10],
    [-90, 60],
    [-45, 90],
    [0, 180],
    [90, 180],
    [135, 90],
    [-67.5, 75],
    [112.5, 135],
    [157.5, 50],
    [-135, 35],
    [-22.5, 135],
    [337.5, 135],
    [-202.5, 50],
    [517.5, 50],
  ] as const)
    TestValidator.predicate(
      `envelope at plane ${plane} is ${expected}`,
      nclose(limit(plane), expected, 1e-9),
    );
  TestValidator.predicate(
    "a table starting after -180 reads the seam before its first knot",
    nclose(
      humanBodyShoulderElevationLimit(
        {
          envelope: [
            [-90, 60],
            [0, 180],
            [135, 90],
          ],
        },
        -120,
      ),
      90 - (30 * 105) / 135,
      1e-9,
    ),
  );
  const shoulder = { range };
  const reaches = (
    plane: number,
    elevation: number,
    axialRotation = 0,
  ): boolean =>
    humanBodyShoulderReaches(shoulder, { plane, elevation, axialRotation });
  for (const [title, plane, elevation, axial, expected] of [
    ["extension at its clinical 60", -90, 60, 0, true],
    ["extension past its clinical 60", -90, 60.5, 0, false],
    ["the arm carried through the chest", -180, 90, 0, false],
    ["cross-body adduction (Pearl 1992)", 124, 90, 0, true],
    ["maximum extension (Pearl 1992)", -88, 55, 0, true],
    ["reaching the perineum (Pearl 1992)", -86, 38, 0, true],
    ["the hanging arm in the posterior plane", -90, 0, 0, true],
    ["the hanging arm in the medial plane", -180, 0, 0, true],
    ["overhead written in the posterior plane", -90, 180, 0, true],
    ["just short of overhead in the posterior plane", -90, 179.9, 0, false],
    ["external rotation at its end", 0, 90, 70, true],
    ["external rotation past its end", 0, 90, 70.5, false],
    ["internal rotation past its end", 0, 90, -90.5, false],
    ["elevation below hanging", 0, -0.5, 0, false],
    ["elevation past overhead", 0, 180.5, 0, false],
    ["a non-finite plane", Number.NaN, 90, 0, false],
    ["a non-finite elevation", 0, Number.POSITIVE_INFINITY, 0, false],
    ["a non-finite axial rotation", 0, 90, Number.NaN, false],
  ] as const)
    TestValidator.equals(title, reaches(plane, elevation, axial), expected);
  TestValidator.equals(
    "overhead refuses when no plane reaches it",
    humanBodyShoulderReaches(
      {
        range: {
          ...range,
          envelope: range.envelope.map(([plane, max]) => [
            plane,
            Math.min(max, 170),
          ]),
        },
      },
      { plane: 90, elevation: 180, axialRotation: 0 },
    ),
    false,
  );
};
