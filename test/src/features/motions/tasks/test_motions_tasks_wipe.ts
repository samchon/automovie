import {
  wipe
} from "../../../../../packages/motions/src/tasks/internal/wipe";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * The `wipe` law's stroke (`wipe.local`, `wipe.circle`, `wipe.reach`): the palm
 * circles the patch `cycles` times from its point nearest the performer, and
 * the wrist reaches, with the elbow kept at 30 degrees, `sqrt(u² + f² + 2 u f
 * cos 30) / (u + f)` of the arm.
 *
 * Scenarios:
 *
 * 1. Radius 0.1, three circles: the stroke starts at (0, 0, -0.1), a twelfth in is
 *    at (0.1, 0, 0), and it ends where it started.
 * 2. Heading 90 about (1, 0, 1), the start (0, 0, -0.1) lies at (0.9, 0, 1).
 * 3. An upper arm of 0.3 and a forearm of 0.25 reach sqrt(0.09 + 0.0625 + 0.15 cos
 *    30) / 0.55 of the arm.
 */
export function test_motions_tasks_wipe(): void {
  TestValidator.predicate(
    "the circles",
    vclose(wipe.local(0.1, 3, 0), { x: 0, y: 0, z: -0.1 }, 1e-12) &&
      vclose(wipe.local(0.1, 3, 1 / 12), { x: 0.1, y: 0, z: 0 }, 1e-12) &&
      vclose(wipe.local(0.1, 3, 1), { x: 0, y: 0, z: -0.1 }, 1e-12) &&
      vclose(
        wipe.circle({ x: 1, y: 0, z: 1 }, 0.1, 90, 3, 0),
        { x: 0.9, y: 0, z: 1 },
        1e-12,
      ),
  );
  const elbow: number = (wipe.ELBOW * Math.PI) / 180;
  TestValidator.predicate(
    "the reach",
    wipe.ELBOW === 30 &&
      nclose(
        wipe.reach({
          measure: { upperArm: 0.3, forearm: 0.25 },
        }),
        Math.sqrt(0.09 + 0.0625 + 0.15 * Math.cos(elbow)) / 0.55,
        1e-12,
      ),
  );
}
