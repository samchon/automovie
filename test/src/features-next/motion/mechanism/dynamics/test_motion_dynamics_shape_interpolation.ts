import { integrateAirborneRotation } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";

/**
 * A tabulated rigid shape preserves its prescribed uniform angular rate between samples.
 *
 * Scenarios:
 * 1. Rotate a single centred segment about its principal Z axis and read the physical shape state on and between knots.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A tabulated rigid shape preserves its prescribed uniform angular rate between samples.
 * @evidence contracts/development/testing.md#independent-expectations The principal Z moment is five, so two radians per second contributes ten units of relative angular momentum.
 * @evidence contracts/development/testing.md#distinguishing-cases Different sample times and repeated queries distinguish interpolation from a retained last answer.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_shape_interpolation(): void {
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 1,
    segments: [
      {
        bone: "hips",
        mass: 1,
        point: { x: 0, y: 0, z: 0 },
        inertia: { x: 2, y: 3, z: 5 },
        axes: identity,
      },
    ],
  };
  const shape = (
    t: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const q = { x: 0, y: 0, z: Math.sin(t), w: Math.cos(t) };
    return new Map([
      [
        "hips",
        {
          bone: "hips",
          worldPosition: { x: 0, y: 0, z: 0 },
          worldRotation: q,
          localRotation: q,
        },
      ],
    ]);
  };
  const history = integrateAirborneRotation.tabulated(model, shape, {
    from: 0,
    to: 1,
    step: 0.125,
  });
  try {
    for (const t of [0.5, 0.25, 0.3125, 0.5]) {
      const state = history(t);
      TestValidator.predicate(
        "rotating principal Z inertia",
        nclose(state.inertia.moments.z, 5),
      );
      TestValidator.predicate(
        "relative spin",
        nclose(state.relative.z, 10, 1e-6),
      );
    }
  } finally {
    history.clear();
  }
}
