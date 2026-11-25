import type { IAutoMovieAngleRange } from "@automovie/interface";
import { boundMountKnotJets } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A shared clinical knot keeps the largest common derivative scale allowed on
 * either side. Supported endpoints, free axes and already legal jets retain the
 * values the caller supplied.
 */
export function test_motions_mounted_knot_jets(): void {
  const range: IAutoMovieAngleRange = { min: 0, max: 10 };
  const positions: readonly (readonly number[])[] = [
    [4, 2, 0, 2, 0, 0],
    [5, 1, 0, 2, 0, 0],
    [7, 2, 0, 3, 0, 0],
  ];
  const jets = {
    velocities: [
      [0.5, 0, 0, 0, 0, 0],
      [10, 5, 1, 0.25, 5, 100],
      [1, 0, 0, 0, 0, 0],
    ],
    accelerations: [
      [0.25, 0, 0, 0, 0, 0],
      [0, -10, 0, 0.5, -10, 200],
      [0.5, 0, 0, 0, 0, 0],
    ],
  };
  const bounded = boundMountKnotJets({
    times: [0, 1, 3],
    positions,
    jets,
    limits: [range, range, range, range, null, undefined],
  });
  // The two-second right span has a control at 5 + λ8. The one-second
  // left span has a control at 1 − λ2.5. These bind at λ=5/8 and λ=2/5.
  TestValidator.equals(
    "either span can limit the shared velocity",
    bounded.velocities,
    [
      [0.5, 0, 0, 0, 0, 0],
      [6.25, 2, 0, 0.25, 0, 100],
      [1, 0, 0, 0, 0, 0],
    ],
  );
  TestValidator.equals(
    "scale the acceleration at the same shared knot",
    bounded.accelerations,
    [
      [0.25, 0, 0, 0, 0, 0],
      [0, -4, 0, 0.5, 0, 200],
      [0.5, 0, 0, 0, 0, 0],
    ],
  );
  TestValidator.predicate(
    "the source velocity and acceleration stay intact",
    jets.velocities[1]![0] === 10 && jets.accelerations[1]![1] === -10,
  );
}
