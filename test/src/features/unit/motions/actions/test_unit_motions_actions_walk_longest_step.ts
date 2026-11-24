import { walk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The documented value's two-figure rounding with the hip range's margin, hip
 * heights: the extension stands a few degrees inside the 30-degree hip range.
 */
const ABOUT: number = 0.02;

/**
 * `walk.longestStep` is the step at which a trailing leg at the thigh's largest
 * extension and a leading leg at its flexion at initial contact
 * (`CONTACT_FLEXION`, 20 degrees), both straight from one hip, put the ankles
 * apart: `sin(extension) + sin(20 degrees)` hip heights, about 0.81.
 *
 * Scenarios:
 *
 * 1. The longest step less the leading leg's `sin(20 degrees)` is the sine of an
 *    extension between 20 and 40 degrees, the walking hip's range.
 * 2. It is about 0.81 hip heights.
 */
export function test_unit_motions_actions_walk_longest_step(): void {
  const longest: number = walk.longestStep();
  const trailing: number =
    (Math.asin(longest - Math.sin((walk.CONTACT_FLEXION * Math.PI) / 180)) *
      180) /
    Math.PI;
  TestValidator.predicate(
    `the trailing extension is a hip's (${trailing} degrees)`,
    trailing > 20 && trailing < 40,
  );
  TestValidator.predicate(
    `about 0.81 hip heights (${longest})`,
    nclose(longest, 0.81, ABOUT),
  );
}
