import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { toolCasePot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `toolCasePot` stands a vessel as `createVessel` does: its rim 0.2 m up and
 * 0.24 m across, its inside floor just above the base, both facing up.
 *
 * Scenario: a pot on a counter at 0.9 m stands unturned, its rim 0.2 m and its
 * floor 5 mm above the base, the floor 1 cm narrower than the rim, both
 * contacts' `+Y` up.
 */
export function test_unit_motions_executable_tool_case_pot(): void {
  const pot: IAutoMovieMotionHumanProp = toolCasePot({ x: 0, y: 0.9, z: 0.5 });
  const rim: IAutoMovieAffordance = pot.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "rim",
  )!;
  const inside: IAutoMovieAffordance = pot.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "inside",
  )!;
  TestValidator.predicate(
    "the pot",
    vclose(pot.frame.position, { x: 0, y: 0.9, z: 0.5 }, 0) &&
      vclose(rim.frame.translation, { x: 0, y: 0.2, z: 0 }, 0) &&
      vclose(inside.frame.translation, { x: 0, y: 0.005, z: 0 }, 0) &&
      rim.width === 0.24 &&
      inside.width === 0.23 &&
      vclose(
        Quaternion.rotateVector(rim.frame.rotation, { x: 0, y: 1, z: 0 }),
        { x: 0, y: 1, z: 0 },
        1e-12,
      ) &&
      vclose(
        Quaternion.rotateVector(inside.frame.rotation, { x: 0, y: 1, z: 0 }),
        { x: 0, y: 1, z: 0 },
        1e-12,
      ),
  );
}
