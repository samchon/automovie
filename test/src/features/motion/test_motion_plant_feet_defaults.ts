import { plantStanceFeet } from "@automovie/engine";
import {
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

// Only a left leg; the default legs also name rightFoot, which is absent.
const skeleton: IAutoMovieSkeleton = {
  id: "leg",
  bones: [
    { bone: "hips", parent: null, rest: t(0, 0.8, 0), constraint: null },
    {
      bone: "leftUpperLeg",
      parent: "hips",
      rest: t(0.1, 0, 0),
      constraint: null,
    },
    {
      bone: "leftLowerLeg",
      parent: "leftUpperLeg",
      rest: t(0, -0.4, 0.15),
      constraint: null,
    },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: t(0, -0.4, -0.15),
      constraint: null,
    },
  ],
};

const skating: IAutoMovieMotion = {
  id: "skate",
  skeleton: "leg",
  duration: 1,
  loop: false,
  keyframes: [
    {
      time: 0,
      pose: { skeleton: "leg", root: t(0, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
    {
      time: 1,
      pose: { skeleton: "leg", root: t(0.15, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
  ],
};

/**
 * Observe the default leg population on a left-only rig: one leftFoot stance is reported while the absent default rightFoot contributes none. Ground 0, tolerance 0.02 and 24 Hz are source defaults exercised here, but this unit does not independently distinguish their exact numerical values.
 *
 * Scenarios:
 *
 * 1. The default left leg plants (one run for leftFoot).
 * 2. The absent rightFoot (named by the default legs) produces no run.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls plantStanceFeet with omitted options and checks the emitted plant count and foot identity, observing default leg selection and missing-foot handling in the product result.
 * @evidence contracts/testing.md#independent-expectations The unchanged rig contains only leftFoot at zero height, so the authored expectation is exactly one leftFoot run with no rightFoot record. No expected value is extracted from the default chain table; exact clock, tolerance and corrected coordinates are not asserted here.
 * @evidence contracts/testing.md#distinguishing-cases Preserves present left versus absent right within the same omitted-options call and the original 0.15-metre root travel. Explicit legs, malformed chains, exact default scalar boundaries and pin geometry belong to adjacent units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its direct planting call with local in-memory rig and motion; the transform helper registers no cases and no renderer, viewer or native artifact is started.
 */
export function test_motion_plant_feet_defaults(): void {
  const planted: ReturnType<typeof plantStanceFeet> = plantStanceFeet({ skeleton, motion: skating });
  TestValidator.equals(
    "only the left foot is planted",
    planted.plants.length,
    1,
  );
  TestValidator.equals(
    "the planted foot is leftFoot",
    planted.plants[0]!.foot,
    "leftFoot",
  );
}
