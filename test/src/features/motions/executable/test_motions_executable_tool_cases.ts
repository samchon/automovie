import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieMotionHumanProp } from "@automovie/interface";
import {
  toolCaseHeld
} from "../../../../../packages/motions/src/executable/cases/internal/toolCaseHeld";
import {
  toolCasePot
} from "../../../../../packages/motions/src/executable/cases/internal/toolCasePot";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** An affordance of a prop by its id. */
const contact = (
  prop: IAutoMovieMotionHumanProp,
  id: string,
): IAutoMovieAffordance =>
  prop.affordances!.find((a: IAutoMovieAffordance): boolean => a.id === id)!;

/**
 * The tool-use capture family's props, shaped as `createTool` and
 * `createVessel` shape them.
 *
 * Scenarios:
 *
 * 1. A hammer lying level is turned a quarter about +X so its 0.3 m handle's +Y
 *    points ahead (world +Z), its power grip 6 cm up the handle and its face on
 *    the head 0.285 m up and 5.5 cm aside.
 * 2. A pot's rim stands 0.2 m up facing up, 0.24 m across.
 */
export function test_motions_executable_tool_cases(): void {
  const hammer: IAutoMovieMotionHumanProp = toolCaseHeld("hammer", {
    x: 0,
    y: 0,
    z: 0,
  });
  TestValidator.predicate(
    "the hammer",
    vclose(
      AutoMovieEngineQuaternion.rotateVector(hammer.frame.rotation, { x: 0, y: 1, z: 0 }),
      { x: 0, y: 0, z: 1 },
      1e-12,
    ) &&
      vclose(
        contact(hammer, "grip").frame.translation,
        { x: 0, y: 0.06, z: 0 },
        0,
      ) &&
      contact(hammer, "grip").grip === "power" &&
      vclose(
        contact(hammer, "face").frame.translation,
        { x: 0, y: 0.285, z: 0.055 },
        0,
      ),
  );
  const rim: IAutoMovieAffordance = contact(
    toolCasePot({ x: 0, y: 0.9, z: 0.5 }),
    "rim",
  );
  TestValidator.predicate(
    "the pot's rim",
    vclose(rim.frame.translation, { x: 0, y: 0.2, z: 0 }, 0) &&
      rim.width === 0.24 &&
      vclose(
        AutoMovieEngineQuaternion.rotateVector(rim.frame.rotation, { x: 0, y: 1, z: 0 }),
        { x: 0, y: 1, z: 0 },
        1e-12,
      ),
  );
}
