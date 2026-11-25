import { AutoMovieArchetypeFrame } from "@automovie/archetypes";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `AutoMovieArchetypeFrame.turn` is the rigid motion turning about a line
 * through a point: `p ↦ R p + (c − R c)`, which keeps the line's points fixed.
 *
 * Scenarios:
 *
 * 1. 90° about +Z through (1, 0, 0): the pivot stays, (2, 0, 0) goes to (1, 1, 0).
 * 2. `move` by that turn carries a frame at (2, 0, 0) to (1, 1, 0), its scale
 *    kept.
 * 3. `chain(after, before)` of two such quarter turns sends (2, 0, 0) to (0, 0,
 *    0), the half turn about the pivot.
 */
export function test_archetypes_core_frame_turn(): void {
  const motion: AutoMovieArchetypeFrame.IMotion = AutoMovieArchetypeFrame.turn(
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    90,
  );
  TestValidator.predicate(
    "the pivot is fixed",
    vclose(motion.translation, { x: 1, y: -1, z: 0 }, 1e-12),
  );
  const moved: IAutoMovieTransform = AutoMovieArchetypeFrame.move(
    motion,
    AutoMovieArchetypeFrame.upright({ x: 2, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "a moved frame",
    vclose(moved.translation, { x: 1, y: 1, z: 0 }, 1e-12) &&
      vclose(moved.scale, { x: 1, y: 1, z: 1 }),
  );
  const half: AutoMovieArchetypeFrame.IMotion = AutoMovieArchetypeFrame.chain(
    motion,
    motion,
  );
  TestValidator.predicate(
    "two quarter turns",
    vclose(
      AutoMovieArchetypeFrame.move(
        half,
        AutoMovieArchetypeFrame.upright({ x: 2, y: 0, z: 0 }),
      ).translation,
      { x: 0, y: 0, z: 0 },
      1e-12,
    ),
  );
}
