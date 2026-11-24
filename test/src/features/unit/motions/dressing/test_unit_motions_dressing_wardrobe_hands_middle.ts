import type { IAutoMovieAffordance } from "@automovie/interface";
import { HumanRefusal, wardrobeHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a quaternion rotation, metres. */
const ROUNDING: number = 1e-12;

/**
 * `wardrobeHands.middle` places an aperture's middle, half its height up its
 * own +Y from the lower edge the frame marks, and refuses an aperture without
 * a positive height and width.
 *
 * Scenarios:
 *
 * 1. A 0.2 m tall sleeve opening at (0, 1, 0), upright: its middle at (0, 1.1,
 *    0).
 * 2. The same opening turned a half turn about +Z: its +Y points down, so the
 *    middle lies at (0, 0.9, 0).
 * 3. An opening with no width is refused on `opening`.
 */
export function test_unit_motions_dressing_wardrobe_hands_middle(): void {
  const opening = (
    rotation: IAutoMovieAffordance["frame"]["rotation"],
    width?: number,
  ): IAutoMovieAffordance => ({
    id: "sleeve",
    kind: "aperture",
    frame: {
      translation: { x: 0, y: 1, z: 0 },
      rotation,
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    height: 0.2,
    ...(width === undefined ? {} : { width }),
  });
  TestValidator.predicate(
    "upright and turned",
    vclose(
      wardrobeHands.middle(opening({ x: 0, y: 0, z: 0, w: 1 }, 0.1)).position,
      { x: 0, y: 1.1, z: 0 },
      ROUNDING,
    ) &&
      vclose(
        wardrobeHands.middle(opening({ x: 0, y: 0, z: 1, w: 0 }, 0.1)).position,
        { x: 0, y: 0.9, z: 0 },
        ROUNDING,
      ),
  );
  let refused: boolean = false;
  try {
    wardrobeHands.middle(opening({ x: 0, y: 0, z: 0, w: 1 }));
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "opening";
  }
  TestValidator.predicate("no width", refused);
}