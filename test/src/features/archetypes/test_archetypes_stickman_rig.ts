import { createAutoMovieStickman } from "@automovie/archetypes";
import {
  AutoMoviePrimitiveShape,
  type IAutoMovieBone,
  type IAutoMovieMaterial,
  type IAutoMovieModel,
  type IAutoMovieModelPart,
  type IAutoMovieSkeleton,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/material";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

/** The figure every case below reads, and the three numbers that shape it. */
const HEIGHT: number = 2;
const HEAD_RADIUS: number = 0.2;
const LIMB_RADIUS: number = 0.1;

/** The one material every part of the figure below wears. */
const BODY: IAutoMovieMaterial = material("body");

/** Build one figure with the shared material, overriding any dimension. */
const built: (dimensions?: {
  height?: number;
  headRadius?: number;
  limbRadius?: number;
}) => IAutoMovieModel = (
  dimensions: {
    height?: number;
    headRadius?: number;
    limbRadius?: number;
  } = {},
): IAutoMovieModel =>
  createAutoMovieStickman({
    id: "figure",
    height: dimensions.height ?? HEIGHT,
    headRadius: dimensions.headRadius ?? HEAD_RADIUS,
    limbRadius: dimensions.limbRadius ?? LIMB_RADIUS,
    material: BODY,
  });

const figure: IAutoMovieModel = built();

const skeleton: IAutoMovieSkeleton = figure.skeleton as NonNullable<
  IAutoMovieModel["skeleton"]
>;

const boneOf: (name: string) => IAutoMovieBone | undefined = (
  name: string,
): IAutoMovieBone | undefined =>
  skeleton.bones.find((entry: IAutoMovieBone): boolean => entry.bone === name);

const partOf: (id: string) => IAutoMovieModelPart | undefined = (
  id: string,
): IAutoMovieModelPart | undefined =>
  figure.parts.find((part: IAutoMovieModelPart): boolean => part.id === id);

/** Read one existing primitive part's shape, throwing if it draws something else. */
const shapeOf: (id: string) => AutoMoviePrimitiveShape = (
  id: string,
): Extract<IAutoMovieModelPart["geometry"], { type: "primitive" }>["shape"] => {
  const part: IAutoMovieModelPart = partOf(id)!;
  if (part.geometry.type !== "primitive")
    throw new Error(`stickman part "${id}" is not a primitive`);
  return part.geometry.shape;
};

/** Where one bone rests relative to its parent. */
const restOf: (name: string) => IAutoMovieVector3 = (
  name: string,
): IAutoMovieVector3 => boneOf(name)!.rest.translation;

/**
 * Every bone's parent, in the order the builder lists them.
 *
 * The parentage is the whole of what makes this a figure rather than thirteen loose transforms: an arm that hung off the hips instead of the spine would still have thirteen bones and still measure the same total height.
 */
const PARENTAGE: ReadonlyArray<readonly [string, string | null]> = [
  ["hips", null],
  ["spine", "hips"],
  ["head", "spine"],
  ["leftUpperArm", "spine"],
  ["leftLowerArm", "leftUpperArm"],
  ["leftHand", "leftLowerArm"],
  ["rightUpperArm", "spine"],
  ["rightLowerArm", "rightUpperArm"],
  ["rightHand", "rightLowerArm"],
  ["leftUpperLeg", "hips"],
  ["leftLowerLeg", "leftUpperLeg"],
  ["rightUpperLeg", "hips"],
  ["rightLowerLeg", "rightUpperLeg"],
];

/** Every part the builder emits, in the order it emits them. */
const PART_IDS: readonly string[] = [
  "pelvis",
  "torso",
  "head",
  "left-upper-arm",
  "left-lower-arm",
  "left-hand",
  "left-thigh",
  "left-shin",
  "right-upper-arm",
  "right-lower-arm",
  "right-hand",
  "right-thigh",
  "right-shin",
];

/** Which bone each of those parts rides. */
const PART_BONES: ReadonlyArray<readonly [string, string]> = [
  ["pelvis", "hips"],
  ["torso", "spine"],
  ["head", "head"],
  ["left-upper-arm", "leftUpperArm"],
  ["left-lower-arm", "leftLowerArm"],
  ["left-hand", "leftHand"],
  ["left-thigh", "leftUpperLeg"],
  ["left-shin", "leftLowerLeg"],
  ["right-upper-arm", "rightUpperArm"],
  ["right-lower-arm", "rightLowerArm"],
  ["right-hand", "rightHand"],
  ["right-thigh", "rightUpperLeg"],
  ["right-shin", "rightLowerLeg"],
];

/**
 * Produce the schematic thirteen-bone stickman model group and check its identity, parentage, bilateral rest placement, primitive attachment and dimension admission.
 *
 * Scenarios:
 * 1. The model is one generated group whose id and skeleton id are the requested id and whose only material is the supplied record.
 * 2. The skeleton is thirteen bones in order, each on the parent that makes the chain a body.
 * 3. The two sides of the rest pose mirror across `x` within the existing vector tolerance, and the arms leave the centre line.
 * 4. The parts are the thirteen the producer emits, in order, each riding its own bone and citing the supplied material.
 * 5. The pelvis and torso boxes are wider than deep, the head is a sphere of the declared head radius, and the upper arm and shin are capsules of the declared limb radius.
 * 6. An arm is laid across the body rather than hanging from it: each upper arm is turned a quarter circle about `z`, in opposite senses left and right, while the head and hands ride their bones without a local transform.
 * 7. Each dimension's inclusive endpoints build, while a value just outside either endpoint, a non-finite value and a blank id throw before any geometry is returned.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls createAutoMovieStickman and inspects the returned model's identity, material list, ordered bones and parents, mirrored translations, part ids/attachments/materials, selected primitive radii and local quarter-turn components, plus the refusals for out-of-range, non-finite and blank inputs. A swapped parent, mirrored sign, misattached part, dropped material or missing range check contradicts these observations.
 * @evidence contracts/testing.md#independent-expectations Literal thirteen-row parent/part tables, authored dimensions, X reflection, quaternion components ±sqrt(1/2) and the documented inclusive metre ranges determine every expectation under the existing nclose/vclose tolerances, without reading the producer's output to derive them.
 * @evidence contracts/testing.md#distinguishing-cases The default figure, the six range endpoints, six just-outside values, NaN and Infinity, and a whitespace id separate admitted from refused input; this schematic producer test supplies no Human anatomical asset, enclosure measurement or visual-quality judgment.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_archetypes_stickman_rig imports the actual archetype producer and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_archetypes_stickman_rig(): void {
  TestValidator.equals(
    "the model is one generated group carrying the requested id and material",
    namedFacts([
      ["id", (): boolean => figure.id === "figure"],
      ["generated", (): boolean => figure.origin === "generated"],
      [
        "material",
        (): boolean =>
          figure.materials.length === 1 && figure.materials[0] === BODY,
      ],
      ["noAsset", (): boolean => figure.asset === null],
    ]),
    { id: true, generated: true, material: true, noAsset: true },
  );

  TestValidator.equals(
    "the skeleton is the declared thirteen bones on the parents that make a body",
    namedFacts([
      ["id", (): boolean => skeleton.id === "figure"],
      [
        "builtOrder",
        (): boolean =>
          skeleton.bones
            .map((entry: IAutoMovieBone): string => entry.bone)
            .join(",") ===
          PARENTAGE.map(
            ([name]: readonly [string, string | null]): string => name,
          ).join(","),
      ],
      [
        "parentage",
        (): boolean =>
          PARENTAGE.every(
            ([name, parent]: readonly [string, string | null]): boolean =>
              boneOf(name)?.parent === parent,
          ),
      ],
      [
        "unconstrained",
        (): boolean =>
          skeleton.bones.every(
            (entry: IAutoMovieBone): boolean => entry.constraint === null,
          ),
      ],
    ]),
    {
      id: true,
      builtOrder: true,
      parentage: true,
      unconstrained: true,
    },
  );

  TestValidator.equals(
    "the two sides of the rest pose mirror across x",
    namedFacts([
      // The right side is the left side reflected, which is what makes a
      // mirrored sign a visible defect rather than a second plausible figure.
      [
        "mirrored",
        (): boolean =>
          (
            [
              ["leftUpperArm", "rightUpperArm"],
              ["leftLowerArm", "rightLowerArm"],
              ["leftHand", "rightHand"],
              ["leftUpperLeg", "rightUpperLeg"],
              ["leftLowerLeg", "rightLowerLeg"],
            ] as const
          ).every(
            ([left, right]:
              | readonly ["leftUpperArm", "rightUpperArm"]
              | readonly ["leftLowerArm", "rightLowerArm"]
              | readonly ["leftHand", "rightHand"]
              | readonly ["leftUpperLeg", "rightUpperLeg"]
              | readonly ["leftLowerLeg", "rightLowerLeg"]): boolean =>
              vclose(restOf(right), {
                x: -restOf(left).x,
                y: restOf(left).y,
                z: restOf(left).z,
              }),
          ),
      ],
      // And the arms really do leave the axis, or the mirror above would hold
      // of a figure whose limbs all stood on the centre line.
      ["armsLeaveTheAxis", (): boolean => restOf("leftUpperArm").x > 0],
    ]),
    {
      mirrored: true,
      armsLeaveTheAxis: true,
    },
  );

  TestValidator.equals(
    "the parts are the thirteen the builder emits, each on its own bone",
    namedFacts([
      ["count", (): boolean => figure.parts.length === PART_IDS.length],
      [
        "order",
        (): boolean =>
          figure.parts
            .map((part: IAutoMovieModelPart): string => part.id)
            .join(",") === PART_IDS.join(","),
      ],
      [
        "bones",
        (): boolean =>
          PART_BONES.every(
            ([id, bone]: readonly [string, string]): boolean =>
              partOf(id)?.attachedBone === bone,
          ),
      ],
      [
        "material",
        (): boolean =>
          figure.parts.every(
            (part: IAutoMovieModelPart): boolean => part.material === "body",
          ),
      ],
    ]),
    { count: true, order: true, bones: true, material: true },
  );

  const pelvis: AutoMoviePrimitiveShape = shapeOf("pelvis");
  const torso: AutoMoviePrimitiveShape = shapeOf("torso");
  const head: AutoMoviePrimitiveShape = shapeOf("head");
  const upperArm: AutoMoviePrimitiveShape = shapeOf("left-upper-arm");
  const shin: AutoMoviePrimitiveShape = shapeOf("left-shin");
  TestValidator.equals(
    "each part draws the dimensions its own parameters state",
    namedFacts([
      // A box wider than it is deep, so exchanging the two would show.
      [
        "wideNotDeep",
        (): boolean =>
          pelvis.type === "box" &&
          torso.type === "box" &&
          pelvis.width > pelvis.depth &&
          torso.width > torso.depth,
      ],
      [
        "head",
        (): boolean =>
          head.type === "sphere" && nclose(head.radius, HEAD_RADIUS),
      ],
      [
        "upperArm",
        (): boolean =>
          upperArm.type === "capsule" && nclose(upperArm.radius, LIMB_RADIUS),
      ],
      [
        "shin",
        (): boolean =>
          shin.type === "capsule" && nclose(shin.radius, LIMB_RADIUS),
      ],
    ]),
    {
      wideNotDeep: true,
      head: true,
      upperArm: true,
      shin: true,
    },
  );

  TestValidator.equals(
    "an arm is laid across the body, in opposite senses on the two sides",
    namedFacts([
      // A quarter turn about `z` is `(0, 0, sin(±45), cos(45))`, written out
      // rather than rebuilt through the same helper the builder used.
      [
        "leftTurned",
        (): boolean =>
          nclose(
            partOf("left-upper-arm")!.transform!.rotation.z,
            -Math.SQRT1_2,
          ) &&
          nclose(partOf("left-upper-arm")!.transform!.rotation.w, Math.SQRT1_2),
      ],
      [
        "rightTurned",
        (): boolean =>
          nclose(
            partOf("right-upper-arm")!.transform!.rotation.z,
            Math.SQRT1_2,
          ) &&
          nclose(
            partOf("right-upper-arm")!.transform!.rotation.w,
            Math.SQRT1_2,
          ),
      ],
      // The head and the hands ride their bones exactly.
      [
        "headAndHandsRideTheirBones",
        (): boolean =>
          partOf("head")!.transform === null &&
          partOf("left-hand")!.transform === null &&
          partOf("right-hand")!.transform === null,
      ],
    ]),
    {
      leftTurned: true,
      rightTurned: true,
      headAndHandsRideTheirBones: true,
    },
  );

  for (const [field, minimum, maximum] of [
    ["height", 0.5, 3],
    ["headRadius", 0.05, 0.5],
    ["limbRadius", 0.01, 0.25],
  ] as const) {
    for (const value of [minimum, maximum])
      TestValidator.predicate(
        `${field} ${value} is an admitted endpoint`,
        built({ [field]: value }).parts.length === PART_IDS.length,
      );
    for (const value of [
      minimum - 0.001,
      maximum + 0.001,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])
      TestValidator.predicate(
        `${field} ${value} is refused`,
        throwsError((): IAutoMovieModel => built({ [field]: value }), field),
      );
  }
  TestValidator.predicate(
    "a blank id is refused",
    throwsError(
      (): IAutoMovieModel =>
        createAutoMovieStickman({
          id: " ",
          height: HEIGHT,
          headRadius: HEAD_RADIUS,
          limbRadius: LIMB_RADIUS,
          material: BODY,
        }),
      "non-whitespace",
    ),
  );
}
