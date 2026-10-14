import { plantStanceFeet } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

// The bent-rest leg of the plant-feet suites; foot lands at world
// (root.x + 0.1, root.y, root.z) before articulation.
const legSkeleton: IAutoMovieSkeleton = {
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

const still: (rootX: number) => IAutoMovieMotion = (
  rootX: number,
): IAutoMovieMotion => ({
  id: "still",
  skeleton: "leg",
  duration: 0.5,
  loop: false,
  keyframes: [0, 0.5].map(
    (time: number): IAutoMovieKeyframe => ({
      time,
      pose: { skeleton: "leg", root: t(rootX, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    }),
  ),
});

/** Ground rises with x: h(x) = 0.2·x. */
const rising: (x: number) => number = (x: number): number => 0.2 * x;

/**
 * Observe local ground height in compact stance metadata and exact record equivalence between a constant ground callback and scalar ground. This unit inspects reported pins rather than measuring the corrected foot's achieved FK height.
 *
 * Scenarios (stationary stand at root x=1 → foot world x=1.1):
 *
 * 1. On the rising slope the stance is detected against the local height and the
 *    plant pins at `y = h(1.1) = 0.22` (hand oracle).
 * 2. The same stand planted with the constant callback `() => 0` produces exactly
 *    the scalar `groundY: 0` plant: the widened parameter preserved the scalar
 *    behavior.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls planting with rising, scalar-zero and callback-zero ground, then observes one sloped run with its literal local pin and equivalent complete compact plant fields for both zero-ground forms.
 * @evidence contracts/testing.md#independent-expectations The authored root x=1 and rest foot x offset 0.1 give x=1.1; h(x)=0.2*x gives y=0.22 independently of pin construction. The unchanged scalar/callback comparison uses nclose/vclose eps=0 to preserve the previous exact numeric requirement; equivalent metadata alone does not prove exact achieved correction.
 * @evidence contracts/testing.md#distinguishing-cases Retains nonconstant slope versus zero plane, scalar versus constant callback, 0.25 stance tolerance and one stationary half-second clip. Ground refusal and achieved contact have separate owning units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its three planting calls and pure local ground callbacks. Fixture helpers register no cases, retain no terrain resource and start no viewer, process or native artifact.
 */
export function test_motion_plant_feet_surface(): void {
  const sloped: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: legSkeleton,
    motion: still(1),
    groundY: rising,
    tolerance: 0.25,
    legs: [LEG],
  });
  TestValidator.equals("one stance run on the slope", sloped.plants.length, 1);
  TestValidator.predicate(
    "pin sits at the local slope height",
    vclose(sloped.plants[0]!.position, { x: 1.1, y: 0.22, z: 0 }),
  );

  const scalar: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: legSkeleton,
    motion: still(1),
    groundY: 0,
    tolerance: 0.25,
    legs: [LEG],
  });
  const constant: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: legSkeleton,
    motion: still(1),
    groundY: (): number => 0,
    tolerance: 0.25,
    legs: [LEG],
  });
  TestValidator.predicate(
    "constant callback plants exactly as the scalar",
    constant.plants.length === scalar.plants.length &&
      constant.plants.every(
        (
          plant: ReturnType<typeof plantStanceFeet>["plants"][number],
          index: number,
        ): boolean => {
          const expected: ReturnType<typeof plantStanceFeet>["plants"][number] =
            scalar.plants[index]!;
          return (
            plant.foot === expected.foot &&
            nclose(plant.start, expected.start, 0) &&
            nclose(plant.end, expected.end, 0) &&
            vclose(plant.position, expected.position, 0)
          );
        },
      ),
  );
}
