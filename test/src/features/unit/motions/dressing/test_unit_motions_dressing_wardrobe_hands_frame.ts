import type { IAutoMovieAffordance } from "@automovie/interface";
import { wardrobeHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `wardrobeHands.frame` reads a declared contact's rigid frame: its
 * translation as the position and its rotation, the scale dropped.
 *
 * Scenario: a collar handle at (0.1, 0.4, 0) turned a quarter about +Y, scaled
 * twice, reads that position and rotation.
 */
export function test_unit_motions_dressing_wardrobe_hands_frame(): void {
  const rotation = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  const collar: IAutoMovieAffordance = {
    id: "collar",
    kind: "handle",
    frame: {
      translation: { x: 0.1, y: 0.4, z: 0 },
      rotation,
      scale: { x: 2, y: 2, z: 2 },
    },
    extent: null,
  };
  TestValidator.equals("the frame", wardrobeHands.frame(collar), {
    position: { x: 0.1, y: 0.4, z: 0 },
    rotation,
  });
}