import {
  AutoMovieArchetypeRefusal,
  createAppliance,
} from "@automovie/archetypes";
import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMinimumJerk } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../features/internal/nclose";

/**
 * Minimum-jerk position stays within travel at representable times next to both endpoints.
 *
 * Scenarios:
 * 1. The scalar and profile positions agree exactly, hold beyond the endpoints and preserve exact zero, half and one.
 * 2. The upper-half position, derivatives and inverse retain the normalized quintic.
 * 3. A washer accepts its closing sample at the lower stop and refuses a requested angle of minus one degree.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the public displacement and articulation boundaries and the derivative and inverse observations.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both public position reads, the rate and inverse, and the washer's articulation. An overshoot, scalar drift or an admitted negative hinge angle fails.
 * @evidence contracts/development/testing.md#independent-expectations The selected doubles next to one have a true remaining quintic share below half an ulp. At three quarters, the rational quintic values are 459/512, 135/128 and -45/8. The washer has a zero-degree lower stop.
 * @evidence contracts/development/testing.md#distinguishing-cases Probes both endpoints, the exact midpoint, the reflected interior and a valid travel versus a real lower-limit violation.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public Engine and archetype in memory, with no renderer or scene clock fixture.
 */
export function test_motion_gesture_minimum_jerk_endpoints(): void {
  const epsilon: number = Number.EPSILON;
  const finalTimes: readonly number[] = [
    1 - 2 * epsilon,
    1 - epsilon,
    1 - epsilon / 2,
  ];
  for (const time of [
    -1,
    0,
    Number.MIN_VALUE,
    2 * Number.MIN_VALUE,
    epsilon / 2,
    epsilon,
    0.5,
    ...finalTimes,
    1,
    1 + epsilon,
  ]) {
    const scalar: number = minimumJerk.share(time);
    const profile: IAutoMovieMinimumJerk.IProfile = minimumJerk(time);
    TestValidator.predicate(
      `bounded identical position at ${time}`,
      scalar >= 0 && scalar <= 1 && Object.is(profile.s, scalar),
    );
  }
  for (const [time, position] of [
    [-1, 0],
    [0, 0],
    [0.5, 0.5],
    ...finalTimes.map((time: number): [number, number] => [time, 1]),
    [1, 1],
    [1 + epsilon, 1],
  ] as const) {
    TestValidator.predicate(
      `correct rounded position at ${time}`,
      minimumJerk.share(time) === position,
    );
  }
  for (const time of [-1, 0, 1, 1 + epsilon]) {
    const profile: IAutoMovieMinimumJerk.IProfile = minimumJerk(time);
    TestValidator.predicate(
      `zero derivatives when holding at ${time}`,
      profile.ds === 0 && profile.dds === 0 && minimumJerk.rate(time) === 0,
    );
  }
  const interior: IAutoMovieMinimumJerk.IProfile = minimumJerk(0.75);
  TestValidator.predicate(
    "upper-half quintic and inverse",
    interior.s === 459 / 512 &&
      interior.ds === 135 / 128 &&
      interior.dds === -45 / 8 &&
      minimumJerk.rate(0.75) === 135 / 128 &&
      nclose(minimumJerk.time(459 / 512), 0.75, 2 ** -48),
  );

  const washer: ReturnType<typeof createAppliance> = createAppliance(
    { kind: "washingMachine" },
    6,
  );
  for (const time of [0, ...finalTimes, 1]) {
    const degrees: number = 94 - 94 * minimumJerk.share(time);
    TestValidator.predicate(
      `valid washer travel at ${time}`,
      degrees >= 0 &&
        washer.articulate({ door: degrees }).travel("door") === degrees,
    );
  }
  const belowStop: number = 94 - 95 * minimumJerk.share(1);
  let refused: unknown;
  try {
    washer.articulate({ door: belowStop });
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "minus one degree is still outside the washer's travel",
    belowStop === -1 &&
      refused instanceof AutoMovieArchetypeRefusal &&
      refused.axis === "door" &&
      refused.value === -1 &&
      refused.feasible?.kind === "range" &&
      refused.feasible.minimum === 0,
  );
}
