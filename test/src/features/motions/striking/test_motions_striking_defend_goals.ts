import { Vector3 } from "@automovie/engine";
import { defendGoals } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A checking leg (`defendGoals.check`): the knee a thigh from the hip along
 * (-0.55 forward, 0.7 up, -0.35 sideways), the ankle a shank on along (-0.2
 * forward, -0.9 up), the knee hint 0.2 m behind the knee, forward facing the
 * strike.
 *
 * Scenario: against a strike coming along -Z (so forward is +Z) from the left,
 * the hip at (0, 1, 0), a 0.45 m thigh and 0.4 m shank lay the knee and ankle
 * on those directions, and the segments keep their lengths.
 */
export function test_motions_striking_defend_goals(): void {
  const hip = { x: 0, y: 1, z: 0 };
  const goal = defendGoals.check(
    hip,
    { x: 0, y: 0, z: -1 },
    { x: 1, y: 0, z: 0 },
    0.45,
    0.4,
  );
  const k = Vector3.normalize({ x: -0.35, y: 0.7, z: -0.55 });
  const knee = Vector3.add(hip, Vector3.scale(k, 0.45));
  const s = Vector3.normalize({ x: 0, y: -0.9, z: -0.2 });
  TestValidator.predicate(
    "the leg",
    vclose(goal.point, Vector3.add(knee, Vector3.scale(s, 0.4)), 1e-12) &&
      vclose(goal.bend, { ...knee, z: knee.z - 0.2 }, 1e-12) &&
      nclose(Vector3.distance(goal.point, knee), 0.4, 1e-12),
  );
}
