import { AutoMovieEngineFramingAimFraction, AutoMovieEngineFramingHeightFraction, AutoMovieEngineFilm } from "@automovie/engine";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSkeleton,
  type IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../../internal/predicates";

const HEIGHT: number = 1.72;

const transform: (y: number) => IAutoMovieTransform = (
  y: number,
): IAutoMovieTransform => ({
  translation: { x: 0, y, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Existing conventional fixture rig with its highest joint at 0.92 of the
 * declared height and lowest at 0.24, without foot or head-top joints.
 */
const skeleton: () => IAutoMovieSkeleton = (): IAutoMovieSkeleton => ({
  id: "probe-rig",
  bones: [
    {
      bone: "hips",
      parent: null,
      rest: transform(HEIGHT * 0.5),
      constraint: null,
    },
    {
      bone: "spine",
      parent: "hips",
      rest: transform(HEIGHT * 0.18),
      constraint: null,
    },
    {
      bone: "head",
      parent: "spine",
      rest: transform(HEIGHT * 0.24),
      constraint: null,
    },
    {
      bone: "leftUpperLeg",
      parent: "hips",
      rest: transform(-HEIGHT * 0.04),
      constraint: null,
    },
    {
      bone: "leftLowerLeg",
      parent: "leftUpperLeg",
      rest: transform(-HEIGHT * 0.22),
      constraint: null,
    },
  ],
});

const part: (
  id: string,
  attachedBone: IAutoMovieModelPart["attachedBone"],
  shape: Extract<
    IAutoMovieModelPart["geometry"],
    { type: "primitive" }
  >["shape"],
  y: number,
) => IAutoMovieModelPart = (
  id: string,
  attachedBone: IAutoMovieModelPart["attachedBone"],
  shape: Extract<
    IAutoMovieModelPart["geometry"],
    { type: "primitive" }
  >["shape"],
  y: number,
): IAutoMovieModelPart => ({
  id,
  name: null,
  geometry: { type: "primitive", shape },
  material: "body",
  attachedBone,
  transform: transform(y),
});

/**
 * A figure that reaches the ground under its lowest joint and past its highest:
 * legs hanging below `leftLowerLeg` and a head sphere above the head joint, so
 * the drawn extent runs 0 to `HEIGHT` while the joints span far less.
 */
const model: () => IAutoMovieModel = (): IAutoMovieModel => ({
  id: "probe-model",
  name: null,
  origin: "generated",
  parts: [
    // Legs: a box centred so its bottom lands on the ground under the knee.
    part(
      "legs",
      "leftLowerLeg",
      { type: "box", width: 0.2, height: HEIGHT * 0.24, depth: 0.2 },
      -HEIGHT * 0.12,
    ),
    // Head: a sphere sitting above the head joint, crown at exactly HEIGHT.
    part(
      "head",
      "head",
      { type: "sphere", radius: HEIGHT * 0.04 },
      HEIGHT * 0.04,
    ),
  ],
  skeleton: skeleton(),
  body: null,
  materials: [],
  asset: null,
});

/**
 * Portable part bounds include geometry beyond the skeleton's extreme joints,
 * which a subject-height consumer needs for full-body framing.
 *
 * The authored model places its floor at zero and crown at 1.72 metres, while
 * the joints span 0.24 to 0.92 of that height. A local band calculation
 * illustrates the consequence using the public framing fractions; it does not
 * call the camera compiler or independently verify those fraction tables.
 *
 * Scenarios:
 *
 * 1. The rig measurement returns the joint span, 0.680 of the figure, and is
 *    documented as such rather than quietly corrected.
 * 2. The drawn extent returns the real figure: floor at 0, crown at 1.72.
 * 3. The local full-framing band derived from joint span excludes more than one
 *    quarter of the model's height, while the band derived from its part extent
 *    covers floor and crown.
 * 4. A model with no skeleton still measures, since a prop is framed too.
 * 5. A model with no parts measures nothing and returns null, leaving the caller's
 *    own fallback in charge instead of inventing a height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish measured joint span, portable visible height, the implied framing band, a prop and missing parts.
 * @evidence contracts/development/testing.md#behavioral-verification The test reads skeleton and model-rest measurements directly and computes an illustrative band from the returned sizes. It repeats the extent calculation for a skeletonless prop and empty parts.
 * @evidence contracts/development/testing.md#independent-expectations The fixture places floor and crown at zero and 1.72 metres while joints cover 0.24 through 0.92 of that height. Their 0.68 fraction must differ from visible height. Substituting each into the public framing fractions determines the illustrative floor and crown coverage.
 */
export function test_engine_film_camera_subject_extent(): void {
  const jointSpan: number = AutoMovieEngineFilm.computeRestHeight(skeleton());
  const extent: ReturnType<typeof AutoMovieEngineFilm.computeModelRestExtentY> =
    AutoMovieEngineFilm.computeModelRestExtentY(model());

  TestValidator.predicate(
    "the rig measurement is the joint span, not the figure",
    nclose(jointSpan, HEIGHT * 0.68, 1e-9),
  );
  TestValidator.equals(
    "the drawn extent is the figure, floor to crown",
    namedFacts([
      ["extentMeasured", (): boolean => extent !== null],
      [
        "floorAtZero",
        // The null check is restated because the narrowing the first fact
        // performs does not reach inside this closure.
        (): boolean => extent !== null && nclose(extent.min, 0, 1e-9),
      ],
      [
        "crownAtHeight",
        // Same restated guard, for the same reason.
        (): boolean => extent !== null && nclose(extent.max, HEIGHT, 1e-9),
      ],
    ]),
    { extentMeasured: true, floorAtZero: true, crownAtHeight: true },
  );

  // The band a `full` shot shows, in world Y, given a base at the ground.
  const band: (height: number) => { low: number; high: number } = (
    height: number,
  ): { low: number; high: number } => {
    const visible: number = height * AutoMovieEngineFramingHeightFraction.full;
    const aim: number = height * AutoMovieEngineFramingAimFraction.full;
    return { low: aim - visible / 2, high: aim + visible / 2 };
  };
  const fromJoints: ReturnType<typeof band> = band(jointSpan);
  const fromExtent: ReturnType<typeof band> = band(extent?.max ?? 0);
  TestValidator.equals(
    "framing from the joint span crops the actor's head, framing from the extent does not",
    namedFacts([
      ["jointsCropTheCrown", (): boolean => fromJoints.high < HEIGHT],
      ["extentHoldsTheCrown", (): boolean => fromExtent.high >= HEIGHT],
      ["extentHoldsTheFloor", (): boolean => fromExtent.low <= 0],
      [
        "cropIsAboutAQuarter",
        (): boolean => (HEIGHT - fromJoints.high) / HEIGHT > 0.25,
      ],
    ]),
    {
      jointsCropTheCrown: true,
      extentHoldsTheCrown: true,
      extentHoldsTheFloor: true,
      cropIsAboutAQuarter: true,
    },
  );

  const prop: IAutoMovieModel = {
    ...model(),
    parts: [
      part("crate", null, { type: "box", width: 1, height: 2, depth: 1 }, 1),
    ],
    skeleton: null,
  };
  const propExtent: ReturnType<typeof AutoMovieEngineFilm.computeModelRestExtentY> =
    AutoMovieEngineFilm.computeModelRestExtentY(prop);
  TestValidator.equals(
    "a rigless prop measures from its own geometry",
    namedFacts([
      ["propMeasured", (): boolean => propExtent !== null],
      [
        "propFloorAtZero",
        // The null check is restated because the narrowing the first fact
        // performs does not reach inside this closure.
        (): boolean => propExtent !== null && nclose(propExtent.min, 0, 1e-9),
      ],
      [
        "propCrownAtTwo",
        // Same restated guard, for the same reason.
        (): boolean => propExtent !== null && nclose(propExtent.max, 2, 1e-9),
      ],
    ]),
    { propMeasured: true, propFloorAtZero: true, propCrownAtTwo: true },
  );
  TestValidator.equals(
    "a model with nothing drawn measures nothing",
    AutoMovieEngineFilm.computeModelRestExtentY({ ...model(), parts: [] }),
    null,
  );
}
