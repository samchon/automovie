import { AutoMovieArchetypeFrame } from "@automovie/archetypes";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `AutoMovieArchetypeFrame.point` maps a frame-local point to its parent,
 * `translation + rotation · p`, and `axis` reads one rotated unit axis.
 *
 * Scenarios:
 *
 * 1. A frame at (1, 2, 3) turned 90° about +Y (q = (0, sin 45°, 0, cos 45°))
 *    sends local (1, 0, 0) to (1, 2, 2), since +X turns to −Z.
 * 2. That frame's +Z axis is +X.
 */
export function test_unit_archetypes_core_frame_point(): void {
  const frame: IAutoMovieTransform = {
    translation: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    scale: { x: 1, y: 1, z: 1 },
  };
  TestValidator.predicate(
    "a local point in the parent",
    vclose(AutoMovieArchetypeFrame.point(frame, { x: 1, y: 0, z: 0 }), {
      x: 1,
      y: 2,
      z: 2,
    }),
  );
  TestValidator.predicate(
    "the turned +Z axis",
    vclose(AutoMovieArchetypeFrame.axis(frame, "z"), { x: 1, y: 0, z: 0 }),
  );
}