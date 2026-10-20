import { Quaternion } from "@automovie/engine/math/Quaternion";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { IAutoMovieStickmanProps } from "./IAutoMovieStickmanProps";

/**
 * Produce the catalogue's articulated figure: one height-driven primitive model group.
 *
 * The group is thirteen bones and thirteen primitive parts in fixed order: a pelvis and torso box, a head sphere, and per side an upper arm, lower arm, hand, thigh and shin. Dimensions are conventional metre proportions for this schematic figure, not measured Human anatomy, and equal props produce equal models on every host.
 *
 * @param props Id, metre dimensions and the material every part wears.
 * @returns A fresh generated model whose skeleton id equals its model id and whose only material is `props.material`.
 * @throws Error naming the correction when the id is blank or a dimension is non-finite or outside its documented range.
 *
 * @evidence contracts/common.md#principled-implementation Height scales every bone offset and most part dimensions, while the head and limb radii set thickness and lower-bound the torso and limb lengths through `max`, so a thick limb never exceeds its own segment. The inclusive ranges are the ones the retired parameter schema admitted, checked before any geometry is built.
 * @evidence contracts/common.md#clear-and-simple-design One producer returns the whole `IAutoMovieModel` group, the type films already reference, so no registry, parameter plan or materializer stands between an author and the figure; placement, LOD and profiles stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Range refusals apply to every figure and throw before output instead of clamping, and no id or production is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the part and bone inventory, metre units, schematic proportions, the skeleton id rule, material adoption and the refusal behavior.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: three range checks, thirteen bones and thirteen parts with their transforms, allocated once per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call must hand its caller an unshared mutable model, so equal props are rebuilt rather than served from a cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The producer retains nothing; the returned model, which references the caller's material record, transfers to the caller at return.
 */
export const createAutoMovieStickman: (
  props: IAutoMovieStickmanProps,
) => IAutoMovieModel = (props: IAutoMovieStickmanProps): IAutoMovieModel => {
  if (props.id.trim().length === 0)
    throw new Error(
      "A stickman model id must contain non-whitespace text. Give the figure the id its scene nodes cite.",
    );
  assertRange(props.id, "height", props.height, 0.5, 3);
  assertRange(props.id, "headRadius", props.headRadius, 0.05, 0.5);
  assertRange(props.id, "limbRadius", props.limbRadius, 0.01, 0.25);
  return {
    id: props.id,
    name: null,
    origin: "generated",
    parts: build(props),
    skeleton: skeletonOf(props.id, props.height),
    body: null,
    materials: [props.material],
    asset: null,
  };
};

/** Refuse one non-finite or out-of-range metre dimension with the inclusive range the figure supports. */
const assertRange: (
  id: string,
  field: string,
  value: number,
  minimum: number,
  maximum: number,
) => void = (
  id: string,
  field: string,
  value: number,
  minimum: number,
  maximum: number,
): void => {
  if (Number.isFinite(value) === false || value < minimum || value > maximum)
    throw new Error(
      `Stickman "${id}" ${field} must be a finite number of metres from ${minimum} through ${maximum}.`,
    );
};

/** Assemble the thirteen conventional height-derived parts from admitted props; every fresh part references the props material by id. */
const build: (props: IAutoMovieStickmanProps) => IAutoMovieModelPart[] = (
  props: IAutoMovieStickmanProps,
): IAutoMovieModelPart[] => {
  const height: number = props.height;
  const headRadius: number = props.headRadius;
  const limbRadius: number = props.limbRadius;
  /** One fresh material-bound primitive attached to its declared bone and local placement. */
  const part: (
    id: string,
    bone: IAutoMovieModelPart["attachedBone"],
    shape: Extract<
      IAutoMovieModelPart["geometry"],
      { type: "primitive" }
    >["shape"],
    local: IAutoMovieModelPart["transform"],
  ) => IAutoMovieModelPart = (
    id: string,
    bone: IAutoMovieModelPart["attachedBone"],
    shape: Extract<
      IAutoMovieModelPart["geometry"],
      { type: "primitive" }
    >["shape"],
    local: IAutoMovieModelPart["transform"],
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: { type: "primitive", shape },
    material: props.material.id,
    attachedBone: bone,
    transform: local,
  });
  const torsoHeight: number = Math.max(headRadius * 2, height * 0.3);
  const upperLimb: number = Math.max(limbRadius * 2, height * 0.15);
  const lowerLimb: number = Math.max(limbRadius * 2, height * 0.14);
  return [
    part(
      "pelvis",
      "hips",
      {
        type: "box",
        width: height * 0.19,
        height: height * 0.12,
        depth: height * 0.11,
      },
      transform(0, 0, 0),
    ),
    part(
      "torso",
      "spine",
      {
        type: "box",
        width: height * 0.25,
        height: torsoHeight,
        depth: height * 0.12,
      },
      transform(0, torsoHeight * 0.22, 0),
    ),
    part("head", "head", { type: "sphere", radius: headRadius }, null),
    ...(["left", "right"] as const).flatMap(
      (side: "left" | "right"): IAutoMovieModelPart[] => {
        const sign: number = side === "left" ? 1 : -1;
        return [
          part(
            `${side}-upper-arm`,
            `${side}UpperArm`,
            {
              type: "capsule",
              radius: limbRadius,
              height: upperLimb,
            },
            horizontal(sign * upperLimb * 0.55),
          ),
          part(
            `${side}-lower-arm`,
            `${side}LowerArm`,
            {
              type: "capsule",
              radius: limbRadius * 0.85,
              height: lowerLimb,
            },
            horizontal(sign * lowerLimb * 0.55),
          ),
          part(
            `${side}-hand`,
            `${side}Hand`,
            { type: "sphere", radius: limbRadius * 1.05 },
            null,
          ),
          part(
            `${side}-thigh`,
            `${side}UpperLeg`,
            {
              type: "capsule",
              radius: limbRadius * 1.15,
              height: height * 0.19,
            },
            transform(0, -height * 0.105, 0),
          ),
          part(
            `${side}-shin`,
            `${side}LowerLeg`,
            {
              type: "capsule",
              radius: limbRadius,
              height: height * 0.19,
            },
            transform(0, -height * 0.105, 0),
          ),
        ];
      },
    ),
  ];
};

/** Construct the thirteen-bone conventional rest tree in metres, with symmetric X offsets and no ROM constraints; the caller owns every bone and transform. */
const skeletonOf: (
  id: string,
  height: number,
) => NonNullable<IAutoMovieModel["skeleton"]> = (
  id: string,
  height: number,
): NonNullable<IAutoMovieModel["skeleton"]> => {
  /** Copy one parent/name relation and metre rest offset into a new bone record. */
  const bone: (
    name: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["bone"],
    parent: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["parent"],
    x: number,
    y: number,
    z: number,
  ) => NonNullable<IAutoMovieModel["skeleton"]>["bones"][number] = (
    name: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["bone"],
    parent: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["parent"],
    x: number,
    y: number,
    z: number,
  ): NonNullable<IAutoMovieModel["skeleton"]>["bones"][number] => ({
    bone: name,
    parent,
    rest: transform(x, y, z),
    constraint: null,
  });
  return {
    id,
    bones: [
      bone("hips", null, 0, height * 0.5, 0),
      bone("spine", "hips", 0, height * 0.18, 0),
      bone("head", "spine", 0, height * 0.24, 0),
      bone("leftUpperArm", "spine", height * 0.125, height * 0.15, 0),
      bone("leftLowerArm", "leftUpperArm", height * 0.17, 0, 0),
      bone("leftHand", "leftLowerArm", height * 0.16, 0, 0),
      bone("rightUpperArm", "spine", -height * 0.125, height * 0.15, 0),
      bone("rightLowerArm", "rightUpperArm", -height * 0.17, 0, 0),
      bone("rightHand", "rightLowerArm", -height * 0.16, 0, 0),
      bone("leftUpperLeg", "hips", height * 0.07, -height * 0.04, 0),
      bone("leftLowerLeg", "leftUpperLeg", 0, -height * 0.22, 0),
      bone("rightUpperLeg", "hips", -height * 0.07, -height * 0.04, 0),
      bone("rightLowerLeg", "rightUpperLeg", 0, -height * 0.22, 0),
    ],
  };
};

/** Create a unit-scale placement with a fresh translation and scale; an explicitly supplied quaternion is retained by reference within this build. */
const transform: (
  x: number,
  y: number,
  z: number,
  rotation?: IAutoMovieTransform["rotation"],
) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
  rotation: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 },
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation,
  scale: { x: 1, y: 1, z: 1 },
});

/** Place a capsule along its side's horizontal arm axis, selecting the signed quarter-turn from its X offset. */
const horizontal: (x: number) => IAutoMovieTransform = (
  x: number,
): IAutoMovieTransform => rotateZ(x < 0 ? 90 : -90, x, 0, 0);

/** Construct a right-handed Z-axis degree turn and a translated unit-scale placement in constant space. */
const rotateZ: (
  degrees: number,
  x: number,
  y: number,
  z: number,
) => IAutoMovieTransform = (
  degrees: number,
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform =>
  transform(x, y, z, Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, degrees));
