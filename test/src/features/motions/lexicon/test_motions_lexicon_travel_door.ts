import type {
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionObstacleAperture,
} from "@automovie/interface";
import {
  humanTravelDoorWay
} from "../../../../../packages/motions/src/lexicon/internal/humanTravelDoorWay";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A door 0.9 m wide along +X, its middle at (0, 0, 2). */
const DOOR: IAutoMovieMotionObstacleAperture = {
  id: "door",
  at: { x: 0, y: 0, z: 2 },
  across: { x: 1, y: 0, z: 0 },
  width: 0.9,
  height: 2,
};

/** A wall with the door, or with two openings. */
const wall = (
  apertures: IAutoMovieMotionObstacleAperture[],
): IAutoMovieMotionHumanObstacle[] => [
  {
    subject: "wall",
    footprint: [
      { x: -2, y: 0, z: 1.9 },
      { x: 2, y: 0, z: 1.9 },
      { x: 2, y: 0, z: 2.1 },
      { x: -2, y: 0, z: 2.1 },
    ],
    bottom: 0,
    top: 2.5,
    apertures,
  },
];

/**
 * The `HumanTravelDoor.passThrough` law's own logic (`humanTravelDoorWay`): the
 * named obstacle's opening, its only one when none is named, and the level way
 * through it at right angles to its width, away from the walker.
 *
 * Scenarios:
 *
 * 1. A walker at the origin passes a door at (0, 0, 2) along +Z, one metre past
 *    the sill at (0, 0, 3); from the far side the way runs along -Z.
 * 2. No such obstacle, or a wall of two openings with none named, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines selection of a named or unique opening and the forward exit on the other side.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a door path from both sides of a sole opening and submits a missing obstacle and unnamed multi-opening wall.
 * @evidence contracts/development/testing.md#independent-expectations Perpendicular opening direction is ±Z for the authored plane. The walk from zero passes the sill at z = 2 and ends one metre beyond it.
 */
export function test_motions_lexicon_travel_door(): void {
  const near: humanTravelDoorWay.IWay = humanTravelDoorWay(
    wall([DOOR]),
    { through: "wall" },
    { x: 0, y: 0.9, z: 0 },
  );
  const far: humanTravelDoorWay.IWay = humanTravelDoorWay(
    wall([DOOR]),
    { through: "wall", aperture: "door" },
    { x: 0, y: 0.9, z: 4 },
  );
  TestValidator.predicate(
    "through, away from the walker",
    vclose(near.out, { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(near.along(1), { x: 0, y: 0, z: 3 }, 1e-12) &&
      vclose(far.out, { x: 0, y: 0, z: -1 }, 1e-12),
  );
  TestValidator.predicate(
    "no obstacle, or no opening named",
    throwsError(() =>
      humanTravelDoorWay(
        wall([DOOR]),
        { through: "fence" },
        { x: 0, y: 0, z: 0 },
      ),
    ) &&
      throwsError(() =>
        humanTravelDoorWay(
          wall([DOOR, { ...DOOR, id: "window" }]),
          { through: "wall" },
          { x: 0, y: 0, z: 0 },
        ),
      ),
  );
}
