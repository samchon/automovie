import type {
  IAutoMovieMotionHumanBikeTransfer,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  humanBikeTransferLine
} from "../../../../../packages/motions/src/lexicon/internal/humanBikeTransferLine";
import { TestValidator } from "@nestia/e2e";

/** A sole's four corners on the floor around a point along +Z. */
const sole = (z: number, y: number = 0): IAutoMovieVector3[] => [
  { x: -0.05, y, z: z - 0.1 },
  { x: 0.05, y, z: z - 0.1 },
  { x: -0.05, y, z: z + 0.1 },
  { x: 0.05, y, z: z + 0.1 },
];

/** The bicycle stopped at the origin, unturned. */
const STOPPED: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/**
 * The `HumanBikeTransfer` law's own rule (`humanBikeTransferLine`), World
 * Triathlon Competition Rules §7.1(h, j): a mount counts a sole wholly on the
 * floor past the mount line, a dismount one wholly on the floor short of the
 * dismount line; the bicycle must stand still through the transfer.
 *
 * The line crosses (0, 0, 1) with the course heading +Z.
 *
 * Scenarios:
 *
 * 1. A sole centred 1.5 m along the course is past the line for a mount and not
 *    short of it for a dismount; one straddling the line qualifies for neither;
 *    one lifted 2 cm is not on the floor.
 * 2. The stopped bicycle is still; one whose pedal has moved a millimetre, or
 *    whose pedal is missing, is not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines ground sole qualification on either side of a line and the stationary-bike requirement.
 * @evidence contracts/development/testing.md#behavioral-verification Calls transfer checks for a wholly clear, straddling and lifted sole and a stopped, slightly moved or missing pedal.
 * @evidence contracts/development/testing.md#independent-expectations The signed positions relative to z = 1 distinguish mount and dismount. A 2 cm lift fails ground contact and a measured 1 mm movement fails stillness.
 */
export function test_motions_lexicon_bike_transfer(): void {
  const line: IAutoMovieMotionHumanBikeTransfer["line"] = {
    x: 0,
    z: 1,
    heading: 0,
  };
  const mount: (s: readonly IAutoMovieVector3[]) => boolean =
    humanBikeTransferLine(line, true);
  const dismount: (s: readonly IAutoMovieVector3[]) => boolean =
    humanBikeTransferLine(line, false);
  TestValidator.equals(
    "the line's sides",
    [
      mount(sole(1.5)),
      dismount(sole(1.5)),
      dismount(sole(0.5)),
      mount(sole(1)),
      dismount(sole(1)),
      mount(sole(1.5, 0.02)),
    ],
    [true, false, true, false, false, false],
  );
  const pedals: Record<"left" | "right", IAutoMovieVector3> = {
    left: { x: 0.1, y: 0.3, z: 0 },
    right: { x: -0.1, y: 0.3, z: 0 },
  };
  TestValidator.equals(
    "still, or moved",
    [
      humanBikeTransferLine.still(STOPPED, STOPPED, pedals, pedals),
      humanBikeTransferLine.still(STOPPED, STOPPED, pedals, {
        ...pedals,
        left: { x: 0.1, y: 0.301, z: 0 },
      }),
      humanBikeTransferLine.still(STOPPED, STOPPED, pedals, {
        right: pedals.right,
      }),
    ],
    [true, false, false],
  );
}
