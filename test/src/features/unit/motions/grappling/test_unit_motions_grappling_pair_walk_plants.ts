import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { PairWalk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `PairWalk.plants` gives each foot a ground plant over the shares of the
 * action outside its own steps.
 *
 * A 4 s action: the left foot steps over 1 to 2 s, the right does not step.
 *
 * Scenarios:
 *
 * 1. The left foot plants before its step, to 1/4, and after it, from 1/2.
 * 2. The right foot plants the whole action.
 */
export function test_unit_motions_grappling_pair_walk_plants(): void {
  const window = (
    part: "leftFoot" | "rightFoot",
    from: number,
    to: number,
  ): IAutoMovieMotionHumanContactWindow => ({
    part,
    kind: "plant",
    from,
    to,
    support: { kind: "ground" },
  });
  TestValidator.equals(
    "the plants around the step",
    PairWalk.plants(
      [
        {
          side: "left",
          from: 1,
          to: 2,
          start: { x: 0, y: 0, z: 0 },
          end: { x: 0, y: 0, z: -0.3 },
        },
      ],
      4,
    ),
    [
      window("leftFoot", 0, 0.25),
      window("leftFoot", 0.5, 1),
      window("rightFoot", 0, 1),
    ],
  );
}
