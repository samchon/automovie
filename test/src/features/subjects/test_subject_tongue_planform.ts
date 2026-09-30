import {
  buildPortraitTongue,
  portraitTongueColumns,
  portraitTongueRows,
  portraitTongueStation,
  portraitTongueWidthEnvelope,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { portraitTongueFixture } from "../internal/portraitTongueFixture";
import { nclose } from "../internal/predicates";

/**
 * The tongue's plan outline is rounded at the tip and its layout has one reader.
 *
 * Scenarios:
 * 1. The width envelope is the ellipse sqrt(1-(1-2v)^2): zero at both poles,
 *    one at mid-body, sqrt(0.75) at both quarter stations, and rising as a
 *    square root from the tip (envelope over sqrt(v) tends to 2), not linearly.
 * 2. A built ring a quarter of the length from the tip has the hand-computed
 *    lateral and dorsal extent, so width follows the envelope while thickness
 *    keeps its sine profile and the mid-body semiaxes stay the authored ones.
 * 3. The station of a vertex follows the builder's layout at both poles, the
 *    first and last vertex of a ring and the neighbouring rings.
 */
export const test_subject_tongue_planform = (): void => {
  TestValidator.predicate(
    "closed poles and mid-body semiaxis",
    portraitTongueWidthEnvelope(0) === 0 &&
      portraitTongueWidthEnvelope(1) === 0 &&
      nclose(portraitTongueWidthEnvelope(0.5), 1),
  );
  TestValidator.predicate(
    "quarter stations",
    nclose(portraitTongueWidthEnvelope(0.25), Math.sqrt(0.75)) &&
      nclose(portraitTongueWidthEnvelope(0.75), Math.sqrt(0.75)),
  );
  TestValidator.predicate(
    "rounded tip rises as a square root",
    nclose(portraitTongueWidthEnvelope(0.0001) / Math.sqrt(0.0001), 2, 1e-3),
  );
  const shape = portraitTongueFixture(),
    mesh = buildPortraitTongue(shape);
  const ring = 8,
    at = (col: number) =>
      mesh.positions.slice(
        (1 + (ring - 1) * portraitTongueColumns + col) * 3,
        (2 + (ring - 1) * portraitTongueColumns + col) * 3,
      );
  TestValidator.predicate(
    "quarter-length ring width follows the ellipse",
    nclose(at(0)[0], shape.halfWidth * Math.sqrt(0.75)),
  );
  const s = Math.sin(Math.PI / 4);
  TestValidator.predicate(
    "quarter-length ring thickness keeps the sine profile",
    nclose(
      at(portraitTongueColumns / 4)[1],
      shape.halfThickness * s +
        shape.dorsumRise * s * s -
        shape.grooveDepth * s,
    ),
  );
  TestValidator.equals(
    "layout size",
    mesh.positions.length / 3,
    2 + (portraitTongueRows - 1) * portraitTongueColumns,
  );
  const last = 1 + (portraitTongueRows - 1) * portraitTongueColumns;
  for (const [vertex, expected] of [
    [0, 0],
    [1, 1 / portraitTongueRows],
    [portraitTongueColumns, 1 / portraitTongueRows],
    [portraitTongueColumns + 1, 2 / portraitTongueRows],
    [last - 1, (portraitTongueRows - 1) / portraitTongueRows],
    [last, 1],
  ] as const)
    TestValidator.predicate(
      "vertex station",
      nclose(portraitTongueStation(vertex), expected),
    );
};
