import { AutoMovieGravity } from "@automovie/engine";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `GymnasticsFlight.at` is a drag-free flight's centre: uniform motion across,
 * `y0 + vy t - g t² / 2` up.
 *
 * Scenarios:
 *
 * 1. Launched from (1, 1, 0) at (2, 4, -1) m/s, after 0.5 s it is at (2, 3 -
 *    g / 8, -0.5).
 * 2. At the launch it is at its start.
 */
export function test_unit_motions_sport_gymnastics_flight_at(): void {
  TestValidator.predicate(
    "the parabola",
    vclose(
      GymnasticsFlight.at({ x: 1, y: 1, z: 0 }, { x: 2, y: 4, z: -1 }, 0.5),
      { x: 2, y: 3 - AutoMovieGravity.STANDARD / 8, z: -0.5 },
      1e-12,
    ) &&
      vclose(
        GymnasticsFlight.at({ x: 1, y: 1, z: 0 }, { x: 2, y: 4, z: -1 }, 0),
        { x: 1, y: 1, z: 0 },
        1e-12,
      ),
  );
}
