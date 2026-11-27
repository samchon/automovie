import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  StrikingHeldGoal
} from "../../../../../packages/motions/src/striking/internal/StrikingHeldGoal";
import {
  StrikingRoll
} from "../../../../../packages/motions/src/striking/internal/StrikingRoll";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Three unit-scale translations and input rounding require fewer than eight ulps. */
const GEOMETRY_ROUNDING_METRES: number = 8 * Number.EPSILON;

/** A 0.8 m blade along +Z, its edge +Y, held in the right hand. */
const TOOL: IAutoMovieMotionHumanStrikingHeld.ITool = {
  side: "right",
  tip: { x: 0, y: 0, z: 0.8 },
  axis: { x: 0, y: 0, z: 1 },
  edge: { x: 0, y: 1, z: 0 },
  rolls: false,
  length: 0.8,
  span: null,
};

/** Held at (0, 1, 0.5), the hand unturned. */
const FRAME: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
  point: { x: 0, y: 1, z: 0.5 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/** The grip 2 cm below and 5 cm ahead of the wrist. */
const GRIP = { x: 0, y: -0.02, z: 0.05 };

/**
 * A held tool's arm goal (`StrikingHeldGoal.of`, `offset`): the wrist the
 * grip's offset back from the held point, the contact the tip drawn back along
 * the axis from the grip, and for a prop two planted limits, at the drawn point
 * and at the tip, within `StrikingRoll.MISS`.
 *
 * Scenarios:
 *
 * 1. The tip drawn 0.3 m back lies 0.5 m along the axis.
 * 2. Drawn 0.1 m back, the wrist is at (0, 1.02, 0.45) and the contact at (0,
 *    -0.02, 0.75), without limits.
 * 3. As the prop `sword`, it is planted with limits at (0, -0.02, 0.75) and (0,
 *    -0.02, 0.85).
 */
export function test_motions_striking_held_goal(): void {
  TestValidator.predicate(
    "the grip-relative offset",
    vclose(StrikingHeldGoal.offset(TOOL, 0.3), { x: 0, y: 0, z: 0.5 }, GEOMETRY_ROUNDING_METRES),
  );
  const bend: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  const contact: IAutoMovieVector3 = { x: 0, y: -0.02, z: 0.75 };
  const bare: IAutoMovieHumanLimbGoal = StrikingHeldGoal.of(TOOL, FRAME, 0.1, bend, GRIP);
  TestValidator.predicate(
    "a bare tool's wrist and local contact",
    vclose(bare.point, { x: 0, y: 1.02, z: 0.45 }, GEOMETRY_ROUNDING_METRES) &&
      vclose(bare.contact!, contact, GEOMETRY_ROUNDING_METRES) &&
      bare.rotation === FRAME.rotation && bare.bend === bend &&
      bare.elbow === "strain" && bare.limits === undefined && bare.planted === undefined,
  );
  const prop: IAutoMovieHumanLimbGoal = StrikingHeldGoal.of({ ...TOOL, prop: "sword" }, FRAME, 0.1, bend, GRIP);
  TestValidator.predicate(
    "a prop preserves the kept point and the tip separately",
    vclose(prop.contact!, contact, GEOMETRY_ROUNDING_METRES) &&
      prop.limits?.length === 2 &&
      vclose(prop.limits[0]!.contact, contact, GEOMETRY_ROUNDING_METRES) &&
      vclose(prop.limits[1]!.contact, { x: 0, y: -0.02, z: 0.85 }, GEOMETRY_ROUNDING_METRES) &&
      prop.limits.every((limit): boolean => limit.bound === StrikingRoll.MISS) && prop.planted === true,
  );
}
