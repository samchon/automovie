import type { IAutoMovieVector3 } from "@automovie/interface";
import { conductArc } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `conductArc` lays the baton tip between two ictuses on their straight line
 * lifted by `lift sin(pi u)`, the share clamped to the beat, so each ictus is
 * its beat's lowest point.
 *
 * A beat from (0, 1, 0) to (0.2, 0.8, 0) with a 0.1 m rebound.
 *
 * Scenarios:
 *
 * 1. At its ends the tip is on the ictuses.
 * 2. Mid-beat it is on the line's midpoint lifted the whole 0.1 m.
 * 3. A share past the beat is clamped to its end.
 */
export function test_unit_motions_music_conduct_arc(): void {
  const from: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const to: IAutoMovieVector3 = { x: 0.2, y: 0.8, z: 0 };
  TestValidator.predicate(
    "the lifted line",
    vclose(conductArc(from, to, 0, 0.1), from, 1e-12) &&
      vclose(conductArc(from, to, 1, 0.1), to, 1e-12) &&
      vclose(conductArc(from, to, 0.5, 0.1), { x: 0.1, y: 1, z: 0 }, 1e-12) &&
      vclose(conductArc(from, to, 1.5, 0.1), to, 1e-12),
  );
}
