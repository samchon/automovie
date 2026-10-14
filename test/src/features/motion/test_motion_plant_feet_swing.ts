import { plantStanceFeet } from "@automovie/engine";
import {
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

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

const LEG: NonNullable<Parameters<typeof plantStanceFeet>[0]["legs"]>[number] =
  {
    foot: "leftFoot",
    upper: "leftUpperLeg",
    lower: "leftLowerLeg",
  } as const;

const motion: (peakY: number) => IAutoMovieMotion = (
  peakY: number,
): IAutoMovieMotion => ({
  id: "bob",
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
      time: 0.5,
      pose: { skeleton: "leg", root: t(0, peakY, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
    {
      time: 1,
      pose: { skeleton: "leg", root: t(0, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
  ],
});

/**
 * Observe detected stance-run counts for a mid-clip lift versus an always-airborne foot. The unit counts compact plants and does not separately inspect whether swing articulation remains unchanged.
 *
 * Scenarios:
 *
 * 1. A foot that lifts mid-clip and lands again yields two stance runs (the middle
 *    swing separates the two detected contact populations).
 * 2. A foot lifted clear of the ground for the whole clip yields no runs.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls plantStanceFeet for the authored rise-and-land clip and for a constantly lifted clip, then observes two runs versus no run in the product's plant records.
 * @evidence contracts/testing.md#independent-expectations The local rest offsets cancel to foot y=0. At 4 Hz the 0.5-metre triangular lift leaves only endpoint samples within 0.02 of ground, producing two isolated runs; root y=1 throughout never meets that threshold. Literal counts are authored independently of contactMask and pinStanceTargets.
 * @evidence contracts/testing.md#distinguishing-cases Preserves lift-then-land versus permanently airborne, sample rate 4, zero plane and 0.02 tolerance. Exact run timestamps, swing-pose preservation and corrected coordinates are not asserted here and belong to other planting checks.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both direct planting calls with local rig/motion data. Private constructors register no additional cases and start no viewer, process or native artifact.
 */
export function test_motion_plant_feet_swing(): void {
  const swung: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton,
    motion: motion(0.5),
    groundY: 0,
    tolerance: 0.02,
    legs: [LEG],
    sampleRate: 4,
  });
  TestValidator.equals("stance splits into two runs", swung.plants.length, 2);

  const lifted: IAutoMovieMotion = {
    id: "lifted",
    skeleton: "leg",
    duration: 1,
    loop: false,
    keyframes: [
      {
        time: 0,
        pose: { skeleton: "leg", root: t(0, 1, 0), joints: [] },
        expression: null,
        easing: "linear",
        bezier: null,
      },
      {
        time: 1,
        pose: { skeleton: "leg", root: t(0, 1, 0), joints: [] },
        expression: null,
        easing: "linear",
        bezier: null,
      },
    ],
  };
  const airborne: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton,
    motion: lifted,
    groundY: 0,
    tolerance: 0.02,
    legs: [LEG],
    sampleRate: 4,
  });
  TestValidator.equals(
    "a foot never in contact is never planted",
    airborne.plants.length,
    0,
  );
}
