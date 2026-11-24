import { Quaternion } from "@automovie/engine";
import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { wardrobeHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a polynomial and a slerp. */
const ROUNDING: number = 1e-12;

/**
 * `wardrobeHands.path` moves a grip between two keys on a minimum-jerk path
 * (Flash and Hogan 1985): the share `10 u^3 - 15 u^4 + 6 u^5` of the way, the
 * rotation slerped by the same share, the fraction clamped to [0, 1].
 *
 * Scenarios, from the origin unturned to (1, 0, 0) turned 90 degrees about +Y:
 *
 * 1. At 0.5 the path is half way, by symmetry: (0.5, 0, 0) turned 45 degrees.
 * 2. At 0.25 it has gone `10/64 - 15/256 + 6/1024`, 0.103515625, of the way.
 * 3. Past either end it rests on that end.
 */
export function test_unit_motions_dressing_wardrobe_hands_path(): void {
  const from: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const to: IAutoMovieRigidTransform = {
    position: { x: 1, y: 0, z: 0 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const half: IAutoMovieRigidTransform = wardrobeHands.path(from, to, 0.5);
  TestValidator.predicate(
    "half way",
    vclose(half.position, { x: 0.5, y: 0, z: 0 }, ROUNDING) &&
      qclose(
        half.rotation,
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 45),
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "a quarter of the time",
    vclose(
      wardrobeHands.path(from, to, 0.25).position,
      { x: 0.103515625, y: 0, z: 0 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "clamped",
    vclose(wardrobeHands.path(from, to, -1).position, from.position, ROUNDING) &&
      vclose(wardrobeHands.path(from, to, 2).position, to.position, ROUNDING),
  );
}