import type { IAutoMovieMotionHumanEntryState } from "@automovie/interface";
import { PairWalk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A planted foot at an ankle point, at rest. */
const foot = (x: number): IAutoMovieMotionHumanEntryState.IFoot => ({
  ankle: { x, y: 0.08, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  planted: true,
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: 0, z: 0 },
  spin: { x: 0, y: 0, z: 0 },
});

/**
 * `PairWalk.steps` carries both feet a displacement in steps of at most
 * `PairWalk.STEP` (0.3 m), alternating from the left, the last step closing
 * the trailing foot, the window split evenly among the steps.
 *
 * The feet stand 0.2 m apart; the pair walks 0.5 m back (-Z) over 0 to 3 s.
 *
 * Scenarios:
 *
 * 1. 0.5 m needs two strides and a closing step: left, right, left, each 1 s.
 * 2. The left foot goes halfway first, then the right all the way, then the left
 *    closes; each step starts where that foot last landed.
 * 3. No displacement takes no step.
 */
export function test_unit_motions_grappling_pair_walk_steps(): void {
  const entry: Pick<IAutoMovieMotionHumanEntryState, "feet"> = {
    feet: { left: foot(0.1), right: foot(-0.1) },
  };
  TestValidator.equals(
    "two strides and a closing step",
    PairWalk.steps(entry, { x: 0, y: 0, z: -0.5 }, 0, 3),
    [
      {
        side: "left",
        from: 0,
        to: 1,
        start: { x: 0.1, y: 0.08, z: 0 },
        end: { x: 0.1, y: 0.08, z: -0.25 },
      },
      {
        side: "right",
        from: 1,
        to: 2,
        start: { x: -0.1, y: 0.08, z: 0 },
        end: { x: -0.1, y: 0.08, z: -0.5 },
      },
      {
        side: "left",
        from: 2,
        to: 3,
        start: { x: 0.1, y: 0.08, z: -0.25 },
        end: { x: 0.1, y: 0.08, z: -0.5 },
      },
    ] satisfies PairWalk.IStep[],
  );
  TestValidator.equals(
    "no displacement",
    PairWalk.steps(entry, { x: 0, y: 0, z: 0 }, 0, 3),
    [],
  );
}
