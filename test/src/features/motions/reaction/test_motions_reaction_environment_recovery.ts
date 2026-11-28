import {
  environmentRecoveryCue
} from "../../../../../packages/motions/src/reaction/internal/environmentRecoveryCue";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * Check how nearby obstacles and insufficient traction contribute recovery
 * cues.
 *
 * Scenarios:
 *
 * 1. At heading 90 degrees, a toe moving at 2 m/s within 1 cm of the kerb
 *    trips at 0.56 m/s along +X. Refuse a toe 5 cm away or stationary.
 * 2. With a 3-4 load and +Z sole motion, a friction coefficient of 0.2
 *    against the required 0.5 gives a 0.54 m/s cue. At 0.6 the surface
 *    carries the load.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the obstacle and traction conditions and resulting cue units.
 * @evidence contracts/development/testing.md#behavioral-verification The tests assert the cue direction, severity and eligibility from distinct physical inputs.
 * @evidence contracts/development/testing.md#independent-expectations The expected trip speed is `0.28 * 2`, and the slip uses the 3-4-5 magnitude and `0.18 * 5 * (1 - 0.2 / 0.5)`.
 */
export function test_motions_reaction_environment_recovery(): void {
  const trip: environmentRecoveryCue.ICue = environmentRecoveryCue.trip(
    "kerb",
    0.01,
    2,
    90,
  );
  TestValidator.predicate(
    "the trip",
    trip.source === "kerb" &&
      nclose(trip.severity, 0.56, 1e-12) &&
      vclose(trip.direction, { x: 1, y: 0, z: 0 }, 1e-12) &&
      throwsError(() => environmentRecoveryCue.trip("kerb", 0.05, 2, 90)) &&
      throwsError(() => environmentRecoveryCue.trip("kerb", 0.01, 0, 90)),
  );
  const slip: environmentRecoveryCue.ICue = environmentRecoveryCue.slip(
    "floor",
    { x: 3, y: 0, z: 4 },
    { x: 0, y: 0, z: 0.5 },
    0.2,
    0.5,
    0,
  );
  TestValidator.predicate(
    "the slip",
    nclose(slip.severity, 0.54, 1e-12) &&
      vclose(slip.direction, { x: 0, y: 0, z: 1 }, 1e-12) &&
      throwsError(() =>
        environmentRecoveryCue.slip(
          "floor",
          { x: 3, y: 0, z: 4 },
          { x: 0, y: 0, z: 0.5 },
          0.6,
          0.5,
          0,
        ),
      ),
  );
}
