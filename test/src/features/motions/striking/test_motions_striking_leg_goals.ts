import {
  StrikingLegGoals
} from "../../../../../packages/motions/src/striking/internal/StrikingLegGoals";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * A striking stance's leg goals (`StrikingLegGoals.bend`, `goal`): the knee
 * hint a shank above the ankle and half a shank ahead along the toes; a bearing
 * leg's goal is planted at its contact, a free one carries none.
 *
 * Scenarios:
 *
 * 1. An unturned foot at (0, 0.08, 0) with a 0.4 m shank hints at (0, 0.48, 0.2);
 *    turned 90 degrees about +Y, at (0.2, 0.48, 0).
 * 2. A bearing goal is planted at its contact; a free one is neither.
 */
export function test_motions_striking_leg_goals(): void {
  const body = { measure: { shank: 0.4 } };
  const ankle = { x: 0, y: 0.08, z: 0 };
  TestValidator.predicate(
    "the hint",
    vclose(
      StrikingLegGoals.bend(body, {
        ankle,
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
      { x: 0, y: 0.48, z: 0.2 },
      1e-12,
    ) &&
      vclose(
        StrikingLegGoals.bend(body, {
          ankle,
          rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
        }),
        { x: 0.2, y: 0.48, z: 0 },
        1e-12,
      ),
  );
  const rotation = { x: 0, y: 0, z: 0, w: 1 };
  const hint = { x: 0, y: 0.48, z: 0.2 };
  TestValidator.equals(
    "bearing and free",
    [
      StrikingLegGoals.goal(ankle, hint, rotation, true, {
        x: 0,
        y: -0.05,
        z: 0.14,
      }),
      StrikingLegGoals.goal(ankle, hint, rotation, false, undefined),
    ],
    [
      {
        point: ankle,
        bend: hint,
        rotation,
        planted: true,
        contact: { x: 0, y: -0.05, z: 0.14 },
      },
      { point: ankle, bend: hint, rotation },
    ],
  );
}
