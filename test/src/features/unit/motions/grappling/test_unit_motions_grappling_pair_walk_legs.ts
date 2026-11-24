import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { PairWalk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

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
 * `PairWalk.legs` poses both feet on a walk: a foot before its step stands
 * planted where it was, during it travels on a minimum-jerk share lifted by
 * `PairWalk.LIFT` times `sin(pi u)`, and after it stands planted where it
 * landed; the knee hint is the caller's from the ankle.
 *
 * The left foot steps 0.3 m back over 0 to 1 s; the right does not step.
 *
 * Scenarios:
 *
 * 1. At the start both feet stand planted at their entry ankles.
 * 2. Halfway, the minimum-jerk share is one half: the left ankle is midway and
 *    lifted the whole 0.04 m, not planted.
 * 3. After the step it stands planted where it landed, and the right never
 *    moved.
 */
export function test_unit_motions_grappling_pair_walk_legs(): void {
  const entry: Pick<IAutoMovieMotionHumanEntryState, "feet"> = {
    feet: { left: foot(0.1), right: foot(-0.1) },
  };
  const steps: PairWalk.IStep[] = [
    {
      side: "left",
      from: 0,
      to: 1,
      start: { x: 0.1, y: 0.08, z: 0 },
      end: { x: 0.1, y: 0.08, z: -0.3 },
    },
  ];
  const knee = (ankle: IAutoMovieVector3): IAutoMovieVector3 => ({
    ...ankle,
    y: ankle.y + 0.4,
  });
  const at = (seconds: number, side: "left" | "right"): IAutoMovieHumanLimbGoal =>
    PairWalk.legs(entry, steps, seconds, knee)[`${side}Leg`]!;

  // 1. At the start.
  TestValidator.predicate(
    "planted at the entry",
    vclose(at(0, "left").point, { x: 0.1, y: 0.08, z: 0 }, 1e-12) &&
      at(0, "left").planted === true,
  );

  // 2. Halfway.
  const half: IAutoMovieHumanLimbGoal = at(0.5, "left");
  TestValidator.predicate(
    "midway and lifted",
    vclose(half.point, { x: 0.1, y: 0.08 + PairWalk.LIFT, z: -0.15 }, 1e-12) &&
      half.planted === false &&
      nclose(half.bend!.y, half.point.y + 0.4, 1e-12),
  );

  // 3. After.
  TestValidator.predicate(
    "landed, and the other foot still",
    vclose(at(2, "left").point, { x: 0.1, y: 0.08, z: -0.3 }, 1e-12) &&
      at(2, "left").planted === true &&
      vclose(at(0.5, "right").point, { x: -0.1, y: 0.08, z: 0 }, 1e-12),
  );
}
