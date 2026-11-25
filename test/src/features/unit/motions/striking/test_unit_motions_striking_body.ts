import { Quaternion } from "@automovie/engine";
import { StrikingBody } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";

/**
 * A striking foot's attitude (`StrikingBody.foot`): the foot's own +Z onto the
 * toes and +Y onto the instep.
 *
 * Scenario: toes ahead and instep up is no turn; toes along +X with the instep
 * up is a quarter turn about +Y; toes down with the instep ahead pitches the
 * foot 90 degrees about +X.
 */
export function test_unit_motions_striking_body(): void {
  TestValidator.predicate(
    "the foot",
    qclose(
      StrikingBody.foot({ x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 0 }),
      { x: 0, y: 0, z: 0, w: 1 },
      1e-12,
    ) &&
      qclose(
        StrikingBody.foot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }),
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
        1e-12,
      ) &&
      qclose(
        StrikingBody.foot({ x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        1e-12,
      ),
  );
}
