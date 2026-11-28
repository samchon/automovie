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
 * Check the timed foot placements for a walking pair.
 *
 * Scenarios:
 *
 * 1. Walk 0.5 m backward in three seconds from feet 0.2 m apart. Place the
 *    left foot halfway, the right at full distance and close with the left.
 * 2. Read the planted windows around each swing. At 0.5 s the left ankle is
 *    midway and lifted while the right stays planted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify stride order, direction, contact windows and the lifted ankle.
 * @evidence contracts/development/testing.md#behavioral-verification The planning and posture functions read authored feet and travel to produce steps, contacts and a midpoint pose.
 * @evidence contracts/development/testing.md#independent-expectations Two 0.25 m strides respect the 0.3 m cap and the third beat closes. Each beat is one second and the midpoint follows symmetric easing.
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
