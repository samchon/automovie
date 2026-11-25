import { CloseStrikeReach } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * An elbow strike's reach (`CloseStrikeReach.closing`, `forearm`): the travel
 * that puts the shoulder an upper arm from the struck point, the part across
 * the travel taking its share of the upper arm; and the forearm folded off the
 * upper arm toward the strike's plane.
 *
 * Scenarios:
 *
 * 1. A point 1 m ahead of the shoulder closes 0.7 m on a 0.3 m upper arm; 0.2 m
 *    across, it closes `1 - sqrt(0.05)`; 0.4 m across it is out of reach.
 * 2. Folded 90 degrees from +Z toward +Y the forearm runs +Y; 135 degrees, (0, sin
 *    135, cos 135); a plane leaning along the arm folds the same.
 */
export function test_motions_striking_close_strike_reach(): void {
  const shoulder = { x: 0, y: 1, z: 0 };
  const toward = { x: 0, y: 0, z: 1 };
  TestValidator.predicate(
    "closing",
    nclose(
      CloseStrikeReach.closing({ x: 0, y: 1, z: 1 }, shoulder, toward, 0.3),
      0.7,
      1e-12,
    ) &&
      nclose(
        CloseStrikeReach.closing({ x: 0.2, y: 1, z: 1 }, shoulder, toward, 0.3),
        1 - Math.sqrt(0.05),
        1e-12,
      ) &&
      throwsError(() =>
        CloseStrikeReach.closing({ x: 0.4, y: 1, z: 1 }, shoulder, toward, 0.3),
      ),
  );
  const up = { x: 0, y: 1, z: 0 };
  const a: number = (135 * Math.PI) / 180;
  TestValidator.predicate(
    "the fold",
    vclose(CloseStrikeReach.forearm(toward, up, 90), up, 1e-12) &&
      vclose(
        CloseStrikeReach.forearm(toward, up, 135),
        { x: 0, y: Math.sin(a), z: Math.cos(a) },
        1e-12,
      ) &&
      vclose(
        CloseStrikeReach.forearm(toward, { x: 0, y: 1, z: 1 }, 135),
        { x: 0, y: Math.sin(a), z: Math.cos(a) },
        1e-12,
      ) &&
      CloseStrikeReach.FOLD === 135,
  );
}
