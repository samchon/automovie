import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { AquaticPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `AquaticPosture.along` is a point a distance ahead of an entry along its
 * heading, at a given height: the heading turns +Z toward +X about +Y.
 *
 * Scenarios:
 *
 * 1. Heading 0 from (1, 5, 2), 3 m ahead at 0.5 m high is (1, 0.5, 5).
 * 2. Heading 90, it is (4, 0.5, 2).
 */
export function test_unit_motions_sport_aquatic_posture_along(): void {
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 1, y: 5, z: 2 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  TestValidator.predicate(
    "ahead along the heading",
    vclose(AquaticPosture.along(entry, 3, 0.5), { x: 1, y: 0.5, z: 5 }, 1e-12) &&
      vclose(
        AquaticPosture.along({ ...entry, yaw: 90 }, 3, 0.5),
        { x: 4, y: 0.5, z: 2 },
        1e-12,
      ),
  );
}
