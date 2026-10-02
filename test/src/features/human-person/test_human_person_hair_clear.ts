import { keepHumanPersonHairClear } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Hair stays off the body at the requested clearance, station by station.
 *
 * The body is one horizontal quad, the square of half-width one at height
 * zero, facing +Y. A strand is a root vertex followed by a left and a right
 * corner per station, as the face's ribbon builder numbers them, and each
 * station moves as a whole by the largest push any of its corners needs, so a
 * ribbon's width survives. The clearance is 0.01.
 *
 * Scenarios:
 * 1. A strand with its root 0.05 above the quad (clear), a station 0.005 above
 *    it (both corners under the clearance) and a station below it (corners at
 *    -0.02 and -0.03): the root stays; the first station rises by 0.005 to
 *    0.01; the second by the larger need, 0.04, so its corners land at 0.02 and
 *    0.01 with their 0.02 separation kept.
 * 2. Hair far above the quad is returned unchanged, with no query compiled.
 * 3. Hair beside the quad, whose nearest feature is its rim, says nothing
 *    about which side it is on and is left alone.
 * 4. A negative or non-finite clearance refuses, and the inputs are never
 *    modified.
 */
export const test_human_person_hair_clear = (): void => {
  const body = {
    positions: [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1],
    indices: [0, 2, 1, 0, 3, 2],
  };
  const strand = {
    positions: [
      0, 0.05, 0, -0.01, 0.005, 0.1, 0.01, 0.005, 0.1, -0.01, -0.02, 0.2, 0.01,
      -0.03, 0.2,
    ],
    indices: [0, 1, 2, 1, 3, 2, 2, 3, 4],
  };
  const before = strand.positions.slice();
  const [moved] = keepHumanPersonHairClear({
    ...body,
    hair: [strand],
    clearance: 0.01,
  });
  const expected = [
    0, 0.05, 0, -0.01, 0.01, 0.1, 0.01, 0.01, 0.1, -0.01, 0.02, 0.2, 0.01,
    0.01, 0.2,
  ];
  TestValidator.predicate(
    "stations rise as wholes to the clearance",
    expected.every((value, at) => nclose(moved[at], value, 1e-9)),
  );
  TestValidator.equals("the input is not modified", strand.positions, before);

  const far = {
    positions: [0, 5, 0, -0.01, 5, 0.1, 0.01, 5, 0.1],
    indices: [0, 1, 2],
  };
  TestValidator.equals(
    "hair far from the body is unchanged",
    keepHumanPersonHairClear({ ...body, hair: [far], clearance: 0.01 })[0],
    far.positions,
  );

  const beside = {
    positions: [1.5, 0.005, 0, 1.5, 0.005, 0.1, 1.52, 0.005, 0.1],
    indices: [0, 1, 2],
  };
  TestValidator.equals(
    "hair whose nearest feature is the rim is left alone",
    keepHumanPersonHairClear({ ...body, hair: [beside], clearance: 0.01 })[0],
    beside.positions,
  );

  for (const bad of [-0.01, Number.NaN, Infinity])
    TestValidator.predicate(
      "a clearance of " + bad + " refuses",
      throwsError(
        () =>
          keepHumanPersonHairClear({ ...body, hair: [strand], clearance: bad }),
        "nonnegative finite",
      ),
    );
};
