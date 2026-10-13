import { STICKMAN_ARCHETYPE } from "@automovie/archetypes";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, vclose } from "../internal/predicates";

/** The figure every case below reads, and the three numbers that shape it. */
const HEIGHT = 2;
const HEAD_RADIUS = 0.2;
const LIMB_RADIUS = 0.1;

const built = (parameters: {
  height: number;
  headRadius: number;
  limbRadius: number;
}) =>
  STICKMAN_ARCHETYPE.build({
    recipe: "figure",
    parameters,
    material: "body",
    skeleton: "figure-rig",
  });

const figure = built({
  height: HEIGHT,
  headRadius: HEAD_RADIUS,
  limbRadius: LIMB_RADIUS,
});

const skeleton = figure.skeleton as NonNullable<IAutoMovieModel["skeleton"]>;

const boneOf = (name: string) =>
  skeleton.bones.find((entry) => entry.bone === name);

const partOf = (id: string): IAutoMovieModelPart | undefined =>
  figure.parts.find((part) => part.id === id);

/** One part's primitive shape, or null when it draws something else. */
const shapeOf = (
  id: string,
): Extract<IAutoMovieModelPart["geometry"], { type: "primitive" }>["shape"] => {
  const part = partOf(id)!;
  if (part.geometry.type !== "primitive")
    throw new Error(`stickman part "${id}" is not a primitive`);
  return part.geometry.shape;
};

/** Where one bone rests relative to its parent. */
const restOf = (name: string): IAutoMovieVector3 =>
  boneOf(name)!.rest.translation;

/**
 * Every bone's parent, in the order the builder lists them.
 *
 * The parentage is the whole of what makes this a figure rather than thirteen
 * loose transforms: an arm that hung off the hips instead of the spine would
 * still have thirteen bones and still measure the same total height.
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
 * The articulated archetype builds one exact figure, not merely thirteen parts.
 *
 * Counting parts is the assertion that cannot fail: a builder that hung every
 * limb off the hips, mirrored the wrong side, exchanged a capsule's radius for
 * its height, or lost the ninety-degree turn that lays an arm across the body
 * would emit thirteen parts and thirteen bones every time. What makes a figure
 * a figure is the parentage, the symmetry and the local placements.
 *
 * Every expectation below follows from the body or the inputs rather than from
 * the builder's proportion table: limbs hang off the spine and hips, the right
 * side reflects the left, the head and limb radii are the parameters passed in,
 * and a capsule laid along `x` is a quarter turn about `z`.
 *
 * Scenarios:
 *
 * 1. The skeleton is the thirteen bones the archetype declares, in that order,
 *    each on the parent that makes the chain a body.
 * 2. The two sides of the rest pose mirror across `x` exactly rather than
 *    approximately, and the arms leave the centre line.
 * 3. The parts are the thirteen the builder emits, in order, each riding its own
 *    bone and carrying the builder's material.
 * 4. The pelvis and torso boxes are wider than deep, the head is a sphere of the
 *    declared head radius, and the upper arm and shin are capsules of the
 *    declared limb radius.
 * 5. An arm is laid across the body rather than hanging from it: each upper arm
 *    is turned a quarter circle about `z`, in opposite senses left and right,
 *    while the head and hands ride their bones without a local transform.
 * 6. The compact projection bound is half the figure's own height.
 */
export const test_archetypes_stickman_rig = (): void => {
  TestValidator.equals(
    "the skeleton is the declared thirteen bones on the parents that make a body",
    namedFacts([
      ["declared", () => STICKMAN_ARCHETYPE.bones.length === PARENTAGE.length],
      [
        "declaredOrder",
        () =>
          STICKMAN_ARCHETYPE.bones.join(",") ===
          PARENTAGE.map(([name]) => name).join(","),
      ],
      ["id", () => skeleton.id === "figure-rig"],
      [
        "builtOrder",
        () =>
          skeleton.bones.map((entry) => entry.bone).join(",") ===
          PARENTAGE.map(([name]) => name).join(","),
      ],
      [
        "parentage",
        () =>
          PARENTAGE.every(([name, parent]) => boneOf(name)?.parent === parent),
      ],
      [
        "unconstrained",
        () => skeleton.bones.every((entry) => entry.constraint === null),
      ],
    ]),
    {
      declared: true,
      declaredOrder: true,
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
        () =>
          (
            [
              ["leftUpperArm", "rightUpperArm"],
              ["leftLowerArm", "rightLowerArm"],
              ["leftHand", "rightHand"],
              ["leftUpperLeg", "rightUpperLeg"],
              ["leftLowerLeg", "rightLowerLeg"],
            ] as const
          ).every(([left, right]) =>
            vclose(restOf(right), {
              x: -restOf(left).x,
              y: restOf(left).y,
              z: restOf(left).z,
            }),
          ),
      ],
      // And the arms really do leave the axis, or the mirror above would hold
      // of a figure whose limbs all stood on the centre line.
      ["armsLeaveTheAxis", () => restOf("leftUpperArm").x > 0],
    ]),
    {
      mirrored: true,
      armsLeaveTheAxis: true,
    },
  );

  TestValidator.equals(
    "the parts are the thirteen the builder emits, each on its own bone",
    namedFacts([
      ["count", () => figure.parts.length === PART_IDS.length],
      [
        "order",
        () =>
          figure.parts.map((part) => part.id).join(",") === PART_IDS.join(","),
      ],
      [
        "bones",
        () =>
          PART_BONES.every(([id, bone]) => partOf(id)?.attachedBone === bone),
      ],
      [
        "material",
        () => figure.parts.every((part) => part.material === "body"),
      ],
    ]),
    { count: true, order: true, bones: true, material: true },
  );

  const pelvis = shapeOf("pelvis");
  const torso = shapeOf("torso");
  const head = shapeOf("head");
  const upperArm = shapeOf("left-upper-arm");
  const shin = shapeOf("left-shin");
  TestValidator.equals(
    "each part draws the dimensions its own parameters state",
    namedFacts([
      // A box wider than it is deep, so exchanging the two would show.
      [
        "wideNotDeep",
        () =>
          pelvis.type === "box" &&
          torso.type === "box" &&
          pelvis.width > pelvis.depth &&
          torso.width > torso.depth,
      ],
      [
        "head",
        () => head.type === "sphere" && nclose(head.radius, HEAD_RADIUS),
      ],
      [
        "upperArm",
        () =>
          upperArm.type === "capsule" && nclose(upperArm.radius, LIMB_RADIUS),
      ],
      [
        "shin",
        () => shin.type === "capsule" && nclose(shin.radius, LIMB_RADIUS),
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
        () =>
          nclose(
            partOf("left-upper-arm")!.transform!.rotation.z,
            -Math.SQRT1_2,
          ) &&
          nclose(partOf("left-upper-arm")!.transform!.rotation.w, Math.SQRT1_2),
      ],
      [
        "rightTurned",
        () =>
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
        () =>
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

  TestValidator.equals(
    "the compact projection bound is half the figure's own height",
    namedFacts([
      [
        "half",
        () =>
          nclose(
            STICKMAN_ARCHETYPE.projectionRadius({
              height: HEIGHT,
              headRadius: HEAD_RADIUS,
              limbRadius: LIMB_RADIUS,
            }),
            HEIGHT / 2,
          ),
      ],
      [
        "unreadableHeightMeasuresZero",
        () =>
          STICKMAN_ARCHETYPE.projectionRadius({
            height: "tall",
            headRadius: HEAD_RADIUS,
            limbRadius: LIMB_RADIUS,
          }) === 0,
      ],
      ["signals", () => STICKMAN_ARCHETYPE.capabilities.join(",") === "signal"],
    ]),
    { half: true, unreadableHeightMeasuresZero: true, signals: true },
  );
};
