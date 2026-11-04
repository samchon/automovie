import {
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";

/**
 * Positive ankle dorsiflexion lifts the checked foot toward its own shank.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates the real public Human at a lifted, outward checking leg with positive and negative ankle flexion, observing the actual toe-to-ankle vector relative to the actual knee-to-ankle shank.
 * @evidence contracts/testing.md#independent-expectations Toes-up dorsiflexion reduces the angle between foot and proximal shank, so their normalized dot product increases. The expectation uses anatomical landmarks rather than a world-camera axis or the implementation quaternion sign.
 * @evidence contracts/testing.md#distinguishing-cases Retains identical hip/knee/root controls and changes only the left ankle between admitted plus/minus10 degrees; the chosen leg is lifted and turned, exposing accidental world-axis reasoning. This verifies a static sign, not a performed check or its safety.
 * @evidence contracts/testing.md#execution-ownership One synchronous CPU root unit reuses HumanPeople calibration and public FK, with no renderer, process or reference-video claim.
 */
export function test_human_check_ankle_direction(): void {
  const person: HumanPeople.IPerson = HumanPeople.person("m1");
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator =
    AutoMovieHumanSkeleton.prepare(person.params, { calibration: person.body });
  const pose: IAutoMovieHumanPose = {
    legs: {
      left: {
        hip: { flexion: 96, abduction: 26, rotation: 32 },
        knee: { flexion: 127 },
        ankle: { dorsiflexion: 10 },
      },
      right: {},
    },
  };
  const up: number = alignment(evaluate(pose));
  pose.legs!.left.ankle!.dorsiflexion = -10;
  const down: number = alignment(evaluate(pose));
  TestValidator.predicate(
    "positive clinical ankle is toes-up relative to shank",
    up > down + 0.05,
  );
}

/** Project the actual foot direction toward the actual proximal shank, independent of scene orientation. */
function alignment(output: AutoMovieHumanSkeleton.IOutput): number {
  const ankle: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
    (row: AutoMovieHumanSkeleton.IPlacement): boolean =>
      row.bone === "leftFoot",
  )!;
  const toe: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
    (row: AutoMovieHumanSkeleton.IPlacement): boolean =>
      row.bone === "leftToe2Distal",
  )!;
  const knee: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
    (row: AutoMovieHumanSkeleton.IPlacement): boolean =>
      row.bone === "leftLowerLeg",
  )!;
  const foot: number[] = toe.position.map(
    (value: number, index: number): number => value - ankle.position[index]!,
  );
  const shank: number[] = knee.position.map(
    (value: number, index: number): number => value - ankle.position[index]!,
  );
  return (
    foot.reduce(
      (sum: number, value: number, index: number): number =>
        sum + value * shank[index]!,
      0,
    ) /
    (Math.hypot(...foot) * Math.hypot(...shank))
  );
}
