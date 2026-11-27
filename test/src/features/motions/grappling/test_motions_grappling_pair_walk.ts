import type { IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanEntryState, IAutoMovieVector3 } from "@automovie/interface";
import {
  PairWalk
} from "../../../../../packages/motions/src/grappling/internal/PairWalk";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** A planted foot at an ankle point, at rest. */
const foot = (x: number): IAutoMovieMotionHumanEntryState.IFoot => ({
  ankle: { x, y: 0.08, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  planted: true,
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: 0, z: 0 },
  spin: { x: 0, y: 0, z: 0 },
});

/** A ground plant of a foot over shares of the action. */
const plant = (
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

/**
 * A grappling pair's walk: steps of at most `PairWalk.STEP` (0.3 m) alternating
 * from the left, the last closing the trailing foot, the window split evenly;
 * each foot planted outside its steps, and lifted `PairWalk.LIFT` at a step's
 * middle on a minimum-jerk share.
 *
 * The feet stand 0.2 m apart; the pair walks 0.5 m back (-Z) over 3 s.
 *
 * Scenarios:
 *
 * 1. Two strides and a closing step: the left halfway, the right all the way, the
 *    left closing, each 1 s, each from where that foot last landed.
 * 2. Each foot plants outside its steps up to the end: the left between its steps
 *    and from its closing landing at the end, the right before and after its
 *    own.
 * 3. Half a second in, the left ankle is midway along its first step and lifted
 *    the whole `LIFT`, not planted, while the right stands where it was.
 */
export function test_motions_grappling_pair_walk(): void {
  const entry: Pick<IAutoMovieMotionHumanEntryState, "feet"> = {
    feet: { left: foot(0.1), right: foot(-0.1) },
  };
  const steps: PairWalk.IStep[] = PairWalk.steps(
    entry,
    { x: 0, y: 0, z: -0.5 },
    0,
    3,
  );
  TestValidator.equals("two strides and a closing step", steps, [
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
  ] satisfies PairWalk.IStep[]);
  TestValidator.equals(
    "the plants around the steps",
    PairWalk.plants(steps, 3),
    [
      plant("leftFoot", 1 / 3, 2 / 3),
      plant("leftFoot", 1, 1),
      plant("rightFoot", 0, 1 / 3),
      plant("rightFoot", 2 / 3, 1),
    ],
  );
  const knee = (ankle: IAutoMovieVector3): IAutoMovieVector3 => ({
    ...ankle,
    y: ankle.y + 0.4,
  });
  const half: Record<string, IAutoMovieHumanLimbGoal> = PairWalk.legs(
    entry,
    steps,
    0.5,
    knee,
  );
  TestValidator.predicate(
    "midway and lifted",
    vclose(
      half.leftLeg!.point,
      { x: 0.1, y: 0.08 + PairWalk.LIFT, z: -0.125 },
      1e-12,
    ) &&
      half.leftLeg!.planted === false &&
      vclose(half.rightLeg!.point, { x: -0.1, y: 0.08, z: 0 }, 1e-12),
  );
}
