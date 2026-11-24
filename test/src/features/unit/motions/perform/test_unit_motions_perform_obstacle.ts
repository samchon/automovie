import type {
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObstacle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** A body half a metre broad and 1.8 m tall. */
const NEED: IAutoMovieMotionHumanObstacle.INeed = { breadth: 0.5, height: 1.8 };

/** A doorway a metre wide and 2 m tall, its middle at x 0.5 on the wall. */
const DOOR: IAutoMovieMotionObstacleAperture = {
  id: "door",
  at: { x: 0.5, y: 0, z: 1 },
  across: { x: 1, y: 0, z: 0 },
  width: 1,
  height: 2,
};

/** A point on the floor. */
const at = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });

/**
 * `HumanObstacle` stands a wall on the floor as a convex footprint with its
 * openings, and `blocking` finds the first obstacle a straight stretch cannot
 * pass, and why.
 *
 * A wall along z = 1 from x −2 to 2, 0.2 m thick and 2.5 m tall; paths run from
 * z = 0 to z = 3.
 *
 * Scenarios:
 *
 * 1. The footprint is the centre line offset 0.1 m to each side.
 * 2. A path at x 0 meets the solid wall 0.9 m along, at its near face.
 * 3. Through the doorway at its middle the path is free; at the door's edge it has
 *    no room, `2 (0.5 − 0.5) = 0`, and is narrow; for a 2.2 m body the 2 m door
 *    leaves too little headroom.
 * 4. A beam from 2 m up blocks a 2.2 m body on headroom and not a 1.8 m one.
 * 5. A path beside the wall is free, and a wall with one end is refused.
 */
export function test_unit_motions_perform_obstacle(): void {
  const plain: IAutoMovieMotionHumanObstacle = HumanObstacle.wall(
    "wall",
    at(-2, 1),
    at(2, 1),
    0.2,
    2.5,
  );
  TestValidator.predicate(
    "the footprint",
    plain.footprint.length === 4 &&
      [at(-2, 1.1), at(2, 1.1), at(2, 0.9), at(-2, 0.9)].every(
        (corner: IAutoMovieVector3, i: number): boolean =>
          vclose(plain.footprint[i]!, corner, 1e-12),
      ) &&
      plain.bottom === 0 &&
      plain.top === 2.5,
  );
  const block: IAutoMovieMotionHumanObstacle.IBlock | null =
    HumanObstacle.blocking([plain], at(0, 0), at(0, 3), NEED);
  TestValidator.predicate(
    "a solid wall",
    block !== null &&
      block.cause === "solid" &&
      nclose(block.distance, 0.9, 1e-12) &&
      nclose(block.at.z, 0.9, 1e-12),
  );

  const doored: IAutoMovieMotionHumanObstacle = HumanObstacle.wall(
    "wall",
    at(-2, 1),
    at(2, 1),
    0.2,
    2.5,
    [DOOR],
  );
  const edge: IAutoMovieMotionHumanObstacle.IBlock | null =
    HumanObstacle.blocking([doored], at(0, 0), at(0, 3), NEED);
  const low: IAutoMovieMotionHumanObstacle.IBlock | null =
    HumanObstacle.blocking([doored], at(0.5, 0), at(0.5, 3), {
      ...NEED,
      height: 2.2,
    });
  TestValidator.predicate(
    "the doorway",
    HumanObstacle.blocking([doored], at(0.5, 0), at(0.5, 3), NEED) === null &&
      edge !== null &&
      edge.cause === "narrow" &&
      edge.aperture === "door" &&
      nclose(edge.short!.has, 0, 1e-12) &&
      low !== null &&
      low.cause === "headroom" &&
      low.short!.has === 2,
  );

  const beam: IAutoMovieMotionHumanObstacle = { ...plain, bottom: 2 };
  TestValidator.predicate(
    "a beam",
    HumanObstacle.blocking([beam], at(0, 0), at(0, 3), {
      ...NEED,
      height: 2.2,
    })?.cause === "headroom" &&
      HumanObstacle.blocking([beam], at(0, 0), at(0, 3), NEED) === null,
  );

  TestValidator.predicate(
    "beside the wall",
    HumanObstacle.blocking([plain], at(3, 0), at(3, 3), NEED) === null,
  );
  TestValidator.error("one end", () =>
    HumanObstacle.wall("wall", at(0, 1), at(0, 1), 0.2, 2.5),
  );
}
