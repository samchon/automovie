import {
  FRAMING_AIM_FRACTION,
  FRAMING_HEIGHT_FRACTION,
  computeModelRestExtentY,
  computeRestHeight,
} from "@automovie/engine";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSkeleton,
  type IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const HEIGHT: number = 1.72;

const transform: (y: number) => IAutoMovieTransform = (
  y: number,
): IAutoMovieTransform => ({
  translation: { x: 0, y, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Existing conventional fixture rig with its highest joint at 0.92 of the declared height and lowest at 0.24, without foot or head-top joints.
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
 * Portable part bounds include geometry beyond the skeleton's extreme joints, which a subject-height consumer needs for full-body framing.
 *
 * The authored model places its floor at zero and crown at 1.72 metres, while the joints span 0.24 to 0.92 of that height. A local band calculation illustrates the consequence using the public framing fractions; it does not call the camera compiler or independently verify those fraction tables.
 *
 * Scenarios:
 *
 * 1. The rig measurement returns the joint span, 0.680 of the figure, and is
 *    documented as such rather than quietly corrected.
 * 2. The drawn extent returns the real figure: floor at 0, crown at 1.72.
 * 3. The local full-framing band derived from joint span excludes more than one quarter of the model's height, while the band derived from its part extent covers floor and crown.
 * 4. A model with no skeleton still measures, since a prop is framed too.
 * 5. A model with no parts measures nothing and returns null, leaving the caller's
 *    own fallback in charge instead of inventing a height.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls computeRestHeight and computeModelRestExtentY on the existing authored rig/parts and checks distinct joint and portable-geometry bounds, plus rigless and empty models, catching a height measurement based only on joints or a fabricated extent for no parts.
 * @evidence contracts/testing.md#independent-expectations Summing the authored rig offsets gives a joint span of 0.68 times 1.72; the leg box's lower face is zero and the head sphere's crown is 1.72. The rigless two-metre box spans zero to two. Those independent construction values constrain the product outputs; the additional local band comparison uses public fractions and does not certify the camera compiler or imported appearance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all five numbered cases: joint under-span, attached box/sphere extent, its local framing-band consequence, rigless box and no-parts null. Nonidentity transforms, malformed rigs, imported appearance and real viewer framing are outside these assertions or covered elsewhere.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_camera_subject_extent entry owns the existing conventional rig and primitive records and calls portable engine measurement in-process, without creating a new Human asset, installing a consumer or starting native compilation, a viewer or a GPU.
 */
export function test_film_camera_subject_extent(): void {
  const jointSpan: number = computeRestHeight(skeleton());
  const extent: ReturnType<typeof computeModelRestExtentY> =
    computeModelRestExtentY(model());

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
    const visible: number = height * FRAMING_HEIGHT_FRACTION.full;
    const aim: number = height * FRAMING_AIM_FRACTION.full;
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
  const propExtent: ReturnType<typeof computeModelRestExtentY> =
    computeModelRestExtentY(prop);
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
    computeModelRestExtentY({ ...model(), parts: [] }),
    null,
  );
}
