import { ANKLE_DORSIFLEXION } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditRange,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The unloaded-ankle audit complains about a foot that bears no weight
 * dorsiflexed past what an unloaded ankle reaches, and not about a planted
 * foot that bears the body (#3523).
 *
 * The range table holds the ankle's loaded limit, 38.8 degrees, the most a
 * foot under a leaning body reaches (Konor et al. 2012); a foot bearing no
 * weight reaches the passive 20. A foot bears weight while a plant window on
 * the ground holds it. Each film is 1 s, read at 24 instants per second, so
 * the 25 instants are 0, 1/24, ... 1.
 *
 * Scenarios:
 * 1. Both ankles at 30 degrees of dorsiflexion, each held by a ground plant
 *    window over the whole film: clean, and inside the range table.
 * 2. The left ankle at 30 degrees with no window holding it: it overshoots
 *    the unloaded limit by 10 on `leftFoot flexion unloaded` at every
 *    instant.
 * 3. The left ankle at 30 degrees, held by a ground plant for the first half
 *    only: it overshoots from the first instant past the window, 12 of 25.
 * 4. A window that is not a plant on the ground (a plant on a prop) does
 *    not bear the foot: it overshoots as in 2.
 * 5. An ankle at the unloaded limit itself is clean, and one plantarflexed
 *    is never read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public reading on hand-written poses and windows; a planted ankle flagged, or a swinging one passed, fails.
 * @evidence contracts/development/testing.md#independent-expectations Each overshoot is the angle the test wrote minus the engine's unloaded limit, and each share a count of the film's instants.
 * @evidence contracts/development/testing.md#distinguishing-cases Planted, free, planted for half, held by a prop, at the limit and plantarflexed.
 * @evidence contracts/development/testing.md#execution-ownership In memory on hand-written poses and windows; no body is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation States the two limits, the film and the 5 scenarios with their numbers.
 */
export function test_motion_audit_unloaded(): void {
  const foot = (
    bone: "leftFoot" | "rightFoot",
    flexion: number,
  ): IAutoMovieJointPose => ({ bone, flexion, abduction: 0, twist: null });
  const plant = (
    part: "leftFoot" | "rightFoot",
    from: number,
    to: number,
    support: IHumanContactWindow.Support = { kind: "ground" },
  ): IHumanContactWindow => ({ part, kind: "plant", from, to, support });
  const read = (
    joints: IAutoMovieJointPose[],
    contacts: IHumanContactWindow[],
  ): AutoMovieMotionHumanAuditRange.IResult => {
    const motion: IAutoMovieMotionHumanAuditMotion = {
      duration: 1,
      bones: () => new Map(),
      segments: () => [
        {
          name: "stand",
          start: 0,
          entryTime: 0,
          end: 1,
          plan: { duration: 1, contacts },
        },
      ],
    };
    return AutoMovieMotionHumanAuditRange.unloaded(
      motion,
      {
        duration: 1,
        pose: (): IAutoMoviePose => ({
          skeleton: "humanoid",
          root: null,
          joints,
        }),
      },
      "a",
    );
  };
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;

  // 1. Planted ankles at 30 degrees.
  const planted = read(
    [foot("leftFoot", 30), foot("rightFoot", 30)],
    [plant("leftFoot", 0, 1), plant("rightFoot", 0, 1)],
  );
  TestValidator.predicate(
    `planted ankles at 30 degrees are clean and inside the loaded limit, got ${planted.overshoot.value} on ${planted.overshoot.where}`,
    planted.overshoot.value === 0 &&
      planted.share === 0 &&
      30 < ANKLE_DORSIFLEXION.loaded &&
      AutoMovieMotionHumanAuditRange.measure(
        {
          duration: 1,
          pose: (): IAutoMoviePose => ({
            skeleton: "humanoid",
            root: null,
            joints: [foot("leftFoot", 30), foot("rightFoot", 30)],
          }),
        },
        "a",
      ).overshoot.value === 0,
  );

  // 2. A free ankle at 30 degrees.
  const free = read([foot("leftFoot", 30)], []);
  TestValidator.predicate(
    `a free ankle at 30 degrees overshoots the unloaded limit by 10, got ${free.overshoot.value} on ${free.overshoot.where} over a share of ${free.share}`,
    near(free.overshoot.value, 30 - ANKLE_DORSIFLEXION.unloaded) &&
      free.overshoot.where === "leftFoot flexion unloaded" &&
      free.share === 1,
  );

  // 3. Planted for the first half.
  const half = read([foot("leftFoot", 30)], [plant("leftFoot", 0, 0.5)]);
  TestValidator.predicate(
    `an ankle planted for half the film overshoots after it, got a share of ${half.share} from ${half.overshoot.seconds} s`,
    near(half.share, 12 / 25) && half.overshoot.seconds > 0.5,
  );

  // 4. A plant on a prop does not bear the foot on the ground.
  const prop = read(
    [foot("leftFoot", 30)],
    [plant("leftFoot", 0, 1, { kind: "prop", subject: "box" })],
  );
  TestValidator.predicate(
    `an ankle held by a prop is read as unloaded, got ${prop.overshoot.value}`,
    near(prop.overshoot.value, 30 - ANKLE_DORSIFLEXION.unloaded),
  );

  // 5. At the limit, and plantarflexed.
  TestValidator.predicate(
    "an ankle at the unloaded limit, and one plantarflexed, are clean",
    read(
      [foot("leftFoot", ANKLE_DORSIFLEXION.unloaded), foot("rightFoot", -45)],
      [],
    ).overshoot.value === 0,
  );
}
