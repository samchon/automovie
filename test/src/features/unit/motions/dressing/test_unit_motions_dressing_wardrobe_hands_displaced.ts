import { Quaternion } from "@automovie/engine";
import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { wardrobeHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `wardrobeHands.displaced` translates a frame by a world offset and keeps its
 * rotation.
 *
 * Scenario: a frame at (0.1, 1, 0.2) turned about +Y, moved by (0, -0.05, 0.1),
 * lies at (0.1, 0.95, 0.3) with the same rotation.
 */
export function test_unit_motions_dressing_wardrobe_hands_displaced(): void {
  const from: IAutoMovieRigidTransform = {
    position: { x: 0.1, y: 1, z: 0.2 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30),
  };
  const moved: IAutoMovieRigidTransform = wardrobeHands.displaced(from, {
    x: 0,
    y: -0.05,
    z: 0.1,
  });
  TestValidator.predicate(
    "moved",
    Math.abs(moved.position.x - 0.1) < 1e-12 &&
      Math.abs(moved.position.y - 0.95) < 1e-12 &&
      Math.abs(moved.position.z - 0.3) < 1e-12 &&
      moved.rotation === from.rotation,
  );
}
