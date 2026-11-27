import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  punchSurface
} from "../../../../../packages/motions/src/striking/internal/punchSurface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** The line ahead along +Z, the punching side out along +X. */
const LINE: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
const OUTWARD: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
const STRAIGHT: IAutoMovieVector3 = { x: 0, y: 0.6, z: 0.8 };

/**
 * A punch's driving direction (`punchSurface.direction`): straight, vertical
 * fist and palm heel drive along the straight line to the target; the others
 * blend 0.8 of their own direction with 0.6 of the line.
 *
 * Scenario: the hook drives (-0.8, 0, 0.6), the uppercut (0, 0.8, 0.6), the
 * backfist (0.8, 0, 0.6), the hammerfist (0, -0.8, 0.6), and the three straight
 * punches along (0, 0.6, 0.8).
 */
export function test_motions_striking_punch_surface(): void {
  const d = (
    technique: Parameters<typeof punchSurface.direction>[0],
  ): IAutoMovieVector3 =>
    punchSurface.direction(technique, LINE, OUTWARD, STRAIGHT);
  TestValidator.predicate(
    "the blended punches",
    vclose(d("hook"), { x: -0.8, y: 0, z: 0.6 }, 1e-12) &&
      vclose(d("uppercut"), { x: 0, y: 0.8, z: 0.6 }, 1e-12) &&
      vclose(d("backfist"), { x: 0.8, y: 0, z: 0.6 }, 1e-12) &&
      vclose(d("hammerfist"), { x: 0, y: -0.8, z: 0.6 }, 1e-12),
  );
  TestValidator.predicate(
    "the straight punches",
    vclose(d("straight"), STRAIGHT, 1e-12) &&
      vclose(d("verticalFist"), STRAIGHT, 1e-12) &&
      vclose(d("palmHeel"), STRAIGHT, 1e-12),
  );
}
