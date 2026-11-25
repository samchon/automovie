import { environmentRecoveryCue } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * The `planEnvironmentRecovery` law's cues (`environmentRecoveryCue`): a trip
 * hands the body 0.28 of the swinging toe's forward speed along the heading; a
 * slip hands it 0.18 of the relative horizontal load times the friction's
 * shortfall `1 - μ / μ_required`, along the sole's slide.
 *
 * Scenarios:
 *
 * 1. A toe 1 cm from the kerb swinging at 2 m/s, heading 90, trips at 0.56 m/s
 *    along +X; one 5 cm clear, or at rest, is refused.
 * 2. A 3-4 load (5 m/s²) needing μ 0.5 on a 0.2 surface, sliding along +Z,
 *    slips at 0.18 · 5 · 0.6 = 0.54 m/s along +Z; a surface of 0.6 carries it.
 */
export function test_unit_motions_reaction_environment_recovery(): void {
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