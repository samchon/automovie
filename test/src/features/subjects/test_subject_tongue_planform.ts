import {
  buildPortraitTongue,
  portraitTongueColumns,
  portraitTongueRingStation,
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
 * 2. Ring 8 of 32 sits at angle pi/4 of the closing ellipse, station
 *    (1 - cos(pi/4))/2, so its half-width is the authored one times sin(pi/4)
 *    and its thickness keeps the sine profile of that station.
 * 3. Ring stations are angle spaced with the mid-body ring exactly at one half,
 *    and the station of a vertex follows the builder's layout at both poles,
 *    the first and last vertex of a ring and the neighbouring rings.
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
  const row = 8,
    at = (col: number) =>
      mesh.positions.slice(
        (1 + (row - 1) * portraitTongueColumns + col) * 3,
        (2 + (row - 1) * portraitTongueColumns + col) * 3,
      );
  TestValidator.predicate(
    "ring width follows the ellipse",
    nclose(at(0)[0], shape.halfWidth * Math.sin(Math.PI / 4)),
  );
  const station = (1 - Math.cos(Math.PI / 4)) / 2,
    s = Math.sin(Math.PI * station);
  TestValidator.predicate(
    "ring thickness keeps the sine profile",
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
  const ring = (k: number): number =>
    (1 - Math.cos((Math.PI * k) / portraitTongueRows)) / 2;
  TestValidator.predicate(
    "mid-body ring at one half, poles at zero and one",
    nclose(portraitTongueRingStation(portraitTongueRows / 2), 0.5) &&
      portraitTongueRingStation(0) === 0 &&
      nclose(portraitTongueRingStation(portraitTongueRows), 1) &&
      nclose(
        portraitTongueRingStation(3) + portraitTongueRingStation(portraitTongueRows - 3),
        1,
      ),
  );
  for (const [vertex, expected] of [
    [0, 0],
    [1, ring(1)],
    [portraitTongueColumns, ring(1)],
    [portraitTongueColumns + 1, ring(2)],
    [last - 1, ring(portraitTongueRows - 1)],
    [last, 1],
  ] as const)
    TestValidator.predicate(
      "vertex station",
      nclose(portraitTongueStation(vertex), expected),
    );
};
