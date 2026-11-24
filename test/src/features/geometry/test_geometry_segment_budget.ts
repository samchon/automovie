import { planAutoMovieSegmentBudget } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The segment budget gives a curved section the fewest segments whose chords
 * stray from the arc by at most one pixel footprint, with a floor of three.
 *
 * Scenarios:
 *
 * 1. With a 1080-pixel image, a 50-degree vertical field of view and a 0.25 m
 *    radius, the budget is 17 segments at 5 m and 9 at 20 m, with 231.6 and
 *    57.90 pixels per metre and tolerances of 0.004318 m and 0.01727 m.
 * 2. Over radii of 0.01 to 2 m and distances of 0.5 to 80 m, the planned count's
 *    chord sagitta `r (1 - cos(pi / n))` lies within the tolerance and one
 *    segment fewer exceeds it, wherever the count is above the floor.
 * 3. A section whose diameter is at most one pixel footprint, where `acos(1 - e /
 *    r)` has no value, and one whose formula gives fewer than three, both get 3
 *    segments.
 * 4. A height, distance or radius of zero, below zero or not finite, and a field
 *    of view of 0 or 180 degrees, each throw naming the parameter.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public engine budget and reads its footprint, tolerance and count, which catches a footprint from the full rather than the half angle, a radius taken for a diameter, a count rounded down or off by one, a NaN or a count below 3 for a sub-pixel section, and silent acceptance of an impossible camera or section.
 * @evidence contracts/development/testing.md#independent-expectations The 17 and 9 segments and their footprints are the issue's worked example, computed by hand from tan 25 degrees = 0.46631; the sagitta bounds follow from the chord geometry, not from the formula's rearrangement; 3 is the triangle, the least closed section.
 * @evidence contracts/development/testing.md#distinguishing-cases The worked example at two distances, a grid of radii and distances with the counts on both sides of the bound, a section within one pixel and one just above, and each refused parameter; the skill page's prose belongs to review.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit over numbers; it starts no host, file or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists its four scenarios with the input and expected behavior of each.
 */
export function test_geometry_segment_budget(): void {
  const camera: { height: number; fovDeg: number } = {
    height: 1080,
    fovDeg: 50,
  };

  // 1. The worked example.
  const near: planAutoMovieSegmentBudget.IResult = planAutoMovieSegmentBudget({
    ...camera,
    distance: 5,
    radius: 0.25,
  });
  const far: planAutoMovieSegmentBudget.IResult = planAutoMovieSegmentBudget({
    ...camera,
    distance: 20,
    radius: 0.25,
  });
  TestValidator.predicate(
    "the worked example gives 17 segments at 5 m and 9 at 20 m",
    near.segments === 17 &&
      far.segments === 9 &&
      nclose(near.pixelsPerMetre, 231.6, 0.05) &&
      nclose(far.pixelsPerMetre, 57.9, 0.005) &&
      nclose(near.tolerance, 0.004318, 5e-7) &&
      nclose(far.tolerance, 0.01727, 5e-6),
  );

  // 2. The fewest segments within the tolerance.
  const misses: string[] = [];
  for (const radius of [0.01, 0.05, 0.25, 1, 2])
    for (const distance of [0.5, 2, 5, 20, 80]) {
      const plan: planAutoMovieSegmentBudget.IResult =
        planAutoMovieSegmentBudget({ ...camera, distance, radius });
      const sagitta: (n: number) => number = (n: number): number =>
        radius * (1 - Math.cos(Math.PI / n));
      if (
        !Number.isSafeInteger(plan.segments) ||
        sagitta(plan.segments) > plan.tolerance * (1 + 1e-12) ||
        (plan.segments > 3 && !(sagitta(plan.segments - 1) > plan.tolerance))
      )
        misses.push(`${radius} m at ${distance} m: ${plan.segments}`);
    }
  TestValidator.equals("each count is the fewest within a pixel", misses, []);

  // 3. A section within one pixel, and one whose formula gives fewer than 3.
  const pixel: number = far.tolerance;
  TestValidator.equals(
    "a section of a pixel or less keeps three segments",
    [pixel / 4, pixel / 2, pixel * 0.6].map(
      (radius: number): number =>
        planAutoMovieSegmentBudget({ ...camera, distance: 20, radius })
          .segments,
    ),
    [3, 3, 3],
  );

  // 4. Refusals by name.
  const refused: [string, planAutoMovieSegmentBudget.IProps][] = [
    ["height", { ...camera, height: 0, distance: 5, radius: 0.25 }],
    ["distance", { ...camera, distance: -1, radius: 0.25 }],
    ["distance", { ...camera, distance: Infinity, radius: 0.25 }],
    ["radius", { ...camera, distance: 5, radius: Number.NaN }],
    ["fovDeg", { height: 1080, fovDeg: 0, distance: 5, radius: 0.25 }],
    ["fovDeg", { height: 1080, fovDeg: 180, distance: 5, radius: 0.25 }],
  ];
  TestValidator.predicate(
    "an impossible camera or section is refused by name",
    refused.every(
      ([name, props]: [string, planAutoMovieSegmentBudget.IProps]): boolean =>
        throwsError(() => planAutoMovieSegmentBudget(props), [name]),
    ),
  );
}
