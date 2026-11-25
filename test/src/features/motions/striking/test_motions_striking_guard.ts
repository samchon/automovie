import { StrikingGuard } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** A right side's face and arm: outward +X, forward +Z. */
const AT: StrikingGuard.IFist = {
  jaw: { x: 0.06, y: 1.6, z: 0.05 },
  outward: { x: 1, y: 0, z: 0 },
  ear: { x: 0.08, y: 1.65, z: 0 },
  shoulder: { x: 0.2, y: 1.45, z: 0 },
  forward: { x: 0, y: 0, z: 1 },
  forearmRadius: 0.04,
  forearm: 0.26,
  leading: 0,
  boxing: false,
  drop: 0,
};

/**
 * A guarding fist (`StrikingGuard.fist`): 0.145 m (two forearm radii and a
 * quarter forearm) ahead of the jaw; the rear hand at ear height a radius
 * outside the ear, the lead hand in front of the shoulder; a boxing guard
 * between jaw and ear height, half a radius nearer; then dropped.
 *
 * Scenarios:
 *
 * 1. The rear hand, the ear 0.02 m outside the jaw, sits at (0.12, 1.65, 0.195),
 *    and dropped 0.05 m at (0.12, 1.6, 0.195).
 * 2. The lead hand sits in front of the shoulder, 0.14 m outside the jaw: (0.2,
 *    1.65, 0.195); halfway leading, halfway between: (0.16, 1.65, 0.195).
 * 3. A leading boxing hand hugs the ear: (0.06, 1.625, 0.175).
 */
export function test_motions_striking_guard(): void {
  TestValidator.predicate(
    "the rear hand",
    vclose(StrikingGuard.fist(AT), { x: 0.12, y: 1.65, z: 0.195 }, 1e-12) &&
      vclose(
        StrikingGuard.fist({ ...AT, drop: 0.05 }),
        { x: 0.12, y: 1.6, z: 0.195 },
        1e-12,
      ),
  );
  TestValidator.predicate(
    "the lead hand",
    vclose(
      StrikingGuard.fist({ ...AT, leading: 1 }),
      { x: 0.2, y: 1.65, z: 0.195 },
      1e-12,
    ) &&
      vclose(
        StrikingGuard.fist({ ...AT, leading: 0.5 }),
        { x: 0.16, y: 1.65, z: 0.195 },
        1e-12,
      ),
  );
  TestValidator.predicate(
    "boxing",
    vclose(
      StrikingGuard.fist({ ...AT, leading: 1, boxing: true }),
      { x: 0.06, y: 1.625, z: 0.175 },
      1e-12,
    ),
  );
}
