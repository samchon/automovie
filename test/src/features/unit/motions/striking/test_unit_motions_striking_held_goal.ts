import type { IAutoMovieMotionHumanStrikingHeld } from "@automovie/interface";
import { StrikingHeldGoal, StrikingRoll } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

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
export function test_unit_motions_striking_held_goal(): void {
  TestValidator.equals("the offset", StrikingHeldGoal.offset(TOOL, 0.3), {
    x: 0,
    y: 0,
    z: 0.5,
  });
  TestValidator.equals(
    "a bare tool",
    StrikingHeldGoal.of(TOOL, FRAME, 0.1, { x: 0, y: -1, z: 0 }, GRIP),
    {
      point: { x: 0, y: 1.02, z: 0.45 },
      rotation: FRAME.rotation,
      bend: { x: 0, y: -1, z: 0 },
      elbow: "strain",
      contact: { x: 0, y: -0.02, z: 0.75 },
    },
  );
  TestValidator.equals(
    "a prop",
    StrikingHeldGoal.of(
      { ...TOOL, prop: "sword" },
      FRAME,
      0.1,
      { x: 0, y: -1, z: 0 },
      GRIP,
    ),
    {
      point: { x: 0, y: 1.02, z: 0.45 },
      rotation: FRAME.rotation,
      bend: { x: 0, y: -1, z: 0 },
      elbow: "strain",
      contact: { x: 0, y: -0.02, z: 0.75 },
      limits: [
        { contact: { x: 0, y: -0.02, z: 0.75 }, bound: StrikingRoll.MISS },
        { contact: { x: 0, y: -0.02, z: 0.85 }, bound: StrikingRoll.MISS },
      ],
      planted: true,
    },
  );
}
