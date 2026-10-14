import { aimRotation } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMoviePrimitiveShape,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { CAT_ROM } from "./CAT_ROM";
import type { ICatParams } from "./ICatParams";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

const at: (
  t: IAutoMovieVector3,
  r?: IAutoMovieQuaternion,
) => IAutoMovieTransform = (
  t: IAutoMovieVector3,
  r?: IAutoMovieQuaternion,
): IAutoMovieTransform => ({
  translation: t,
  rotation: r ?? { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const bone: (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  rest: IAutoMovieTransform,
) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  rest: IAutoMovieTransform,
): IAutoMovieBone => ({
  bone: name,
  parent,
  rest,
  constraint: CAT_ROM[name] ?? null,
});

const yToDir: (dir: IAutoMovieVector3) => IAutoMovieQuaternion = (
  dir: IAutoMovieVector3,
): IAutoMovieQuaternion => aimRotation({ x: 0, y: 1, z: 0 }, dir);

const capsule: (radius: number, length: number) => AutoMoviePrimitiveShape = (
  radius: number,
  length: number,
): AutoMoviePrimitiveShape => ({
  type: "capsule",
  radius,
  height: Math.max(0.01, length - 2 * radius),
});

const rod: (
  id: string,
  boneName: AutoMovieHumanoidBone,
  seg: IAutoMovieVector3,
  radius: number,
) => IAutoMovieModelPart = (
  id: string,
  boneName: AutoMovieHumanoidBone,
  seg: IAutoMovieVector3,
  radius: number,
): IAutoMovieModelPart => ({
  id,
  name: id,
  geometry: {
    type: "primitive",
    shape: capsule(radius, Math.hypot(seg.x, seg.y, seg.z)),
  },
  material: "fur",
  attachedBone: boneName,
  transform: at(v(seg.x / 2, seg.y / 2, seg.z / 2), yToDir(seg)),
});

/**
 * Construct twenty closed-enum bones and 32 rigid primitive parts in +Y-up/+Z-forward metres. Arms are front legs, legs are hind legs and the little-finger chain is the tail; the existing quadruped pages leave rest-frame/axis overrides undefined to retain raw rig-space interpretation. neckLength is retained in the input shape but this builder ignores it: neck/head offsets remain fixed at (0,0.05,0.09) and (0,0.03,0.08) metres. Model and returned skeleton share one wrapper. This disconnected rod/sphere/cone representation and overlapping joint spheres are not continuous anatomical skin; capsule cylinders retain a 0.01-metre minimum and may exceed short segments.
 *
 * @evidence contracts/common.md#principled-implementation Explicit parent/rest transforms and canonical aimRotation place the fixed rods and other primitives deterministically, with all authored lengths already in metres.
 * @evidence contracts/common.md#clear-and-simple-design Local literal helpers expose each cat part; canonical engine FK and viewer primitive upload remain downstream responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed offsets, palette, rod overlaps and CAT_ROM are conventional demo choices, not measured anatomy. Positivity/combined-shape admission and actual displayed health remain unproven.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Twenty bones and 32 parts bound document assembly; viewer tessellation, GPU upload and per-frame FK retain their own costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One skeleton wrapper serves both returned references and constraints alias CAT_ROM; fresh actor/model arrays are allocated per call to preserve independently mutable instances.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned documents and must not mutate borrowed CAT_ROM rows; this builder acquires no worker, GPU handle, timer or cross-call cache. Page/viewer consumers own uploaded resources.
 *
 * @author Samchon
 */
export const buildCat: (p: ICatParams) => {
  /** Caller-owned rig wrapper, also referenced by model.skeleton; constraints borrow CAT_ROM rows. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh rigid primitive document; its shared skeleton is not a realized renderer resource. */
  model: IAutoMovieModel;
} = (
  p: ICatParams,
): {
  /** Caller-owned rig wrapper, also referenced by model.skeleton; constraints borrow CAT_ROM rows. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh rigid primitive document; its shared skeleton is not a realized renderer resource. */
  model: IAutoMovieModel;
} => {
  const H: number = p.backHeight;
  const t1: number = p.trunkLength * 0.5; // hips→spine and spine→chest
  const lh: number = p.legHalf;
  const down: (len: number) => IAutoMovieVector3 = (
    len: number,
  ): IAutoMovieVector3 => v(0, -len, 0);

  const bones: IAutoMovieBone[] = [
    bone("hips", null, at(v(0, H, 0))),
    bone("spine", "hips", at(v(0, 0, t1))),
    bone("chest", "spine", at(v(0, 0, t1))),
    bone("neck", "chest", at(v(0, 0.05, 0.09))),
    bone("head", "neck", at(v(0, 0.03, 0.08))),
    // front legs (from chest), pointing down
    bone("leftUpperArm", "chest", at(v(lh, 0, 0))),
    bone("leftLowerArm", "leftUpperArm", at(down(p.upperLeg))),
    bone("leftHand", "leftLowerArm", at(down(p.lowerLeg))),
    bone("rightUpperArm", "chest", at(v(-lh, 0, 0))),
    bone("rightLowerArm", "rightUpperArm", at(down(p.upperLeg))),
    bone("rightHand", "rightLowerArm", at(down(p.lowerLeg))),
    // hind legs (from hips), pointing down
    bone("leftUpperLeg", "hips", at(v(lh, 0, 0))),
    bone("leftLowerLeg", "leftUpperLeg", at(down(p.upperLeg))),
    bone("leftFoot", "leftLowerLeg", at(down(p.lowerLeg))),
    bone("rightUpperLeg", "hips", at(v(-lh, 0, 0))),
    bone("rightLowerLeg", "rightUpperLeg", at(down(p.upperLeg))),
    bone("rightFoot", "rightLowerLeg", at(down(p.lowerLeg))),
    // tail (repurposed finger chain), curving up and back from the hips
    bone("leftLittleProximal", "hips", at(v(0, 0.05, -0.1))),
    bone("leftLittleIntermediate", "leftLittleProximal", at(v(0, 0.03, -0.09))),
    bone("leftLittleDistal", "leftLittleIntermediate", at(v(0, 0.015, -0.08))),
  ];

  const r: number = p.rodRadius;
  const tr: number = p.trunkRadius;
  const ball: (
    id: string,
    boneName: AutoMovieHumanoidBone,
  ) => IAutoMovieModelPart = (
    id: string,
    boneName: AutoMovieHumanoidBone,
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: { type: "primitive", shape: { type: "sphere", radius: r * 1.3 } },
    material: "fur",
    attachedBone: boneName,
    transform: at(v(0, 0, 0)),
  });
  /** A sphere of arbitrary radius/material at an offset from a bone origin. */
  const knob: (
    id: string,
    boneName: AutoMovieHumanoidBone,
    radius: number,
    material: string,
    offset: IAutoMovieVector3,
  ) => IAutoMovieModelPart = (
    id: string,
    boneName: AutoMovieHumanoidBone,
    radius: number,
    material: string,
    offset: IAutoMovieVector3,
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: { type: "primitive", shape: { type: "sphere", radius } },
    material,
    attachedBone: boneName,
    transform: at(offset),
  });
  const cone: (
    id: string,
    boneName: AutoMovieHumanoidBone,
    offset: IAutoMovieVector3,
    height: number,
  ) => IAutoMovieModelPart = (
    id: string,
    boneName: AutoMovieHumanoidBone,
    offset: IAutoMovieVector3,
    height: number,
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: {
      type: "primitive",
      shape: { type: "cone", radius: height * 0.6, height },
    },
    material: "fur",
    attachedBone: boneName,
    transform: at(offset),
  });

  const parts: IAutoMovieModelPart[] = [
    // horizontal spine: a chunky trunk tapering up the neck
    rod("trunkRear", "hips", v(0, 0, t1), tr),
    rod("trunkFront", "spine", v(0, 0, t1), tr),
    rod("neckRod", "chest", v(0, 0.05, 0.09), tr * 0.8),
    rod("headStalk", "neck", v(0, 0.03, 0.08), tr * 0.7),
    {
      id: "head",
      name: "head",
      geometry: {
        type: "primitive",
        shape: { type: "sphere", radius: p.headRadius },
      },
      material: "fur",
      attachedBone: "head",
      transform: at(v(0, 0.01, 0.03)),
    },
    // ears
    cone("earL", "head", v(0.04, p.headRadius * 0.9, 0.0), 0.05),
    cone("earR", "head", v(-0.04, p.headRadius * 0.9, 0.0), 0.05),
    // a face on the front (+Z): two eyes with dark pupils and a small nose
    knob(
      "eyeL",
      "head",
      p.headRadius * 0.3,
      "eye",
      v(0.032, 0.032, p.headRadius * 0.92),
    ),
    knob(
      "eyeR",
      "head",
      p.headRadius * 0.3,
      "eye",
      v(-0.032, 0.032, p.headRadius * 0.92),
    ),
    knob(
      "pupilL",
      "head",
      p.headRadius * 0.13,
      "pupil",
      v(0.034, 0.03, p.headRadius * 1.12),
    ),
    knob(
      "pupilR",
      "head",
      p.headRadius * 0.13,
      "pupil",
      v(-0.034, 0.03, p.headRadius * 1.12),
    ),
    knob(
      "nose",
      "head",
      p.headRadius * 0.16,
      "pupil",
      v(0, -0.004, p.headRadius * 1.12),
    ),
    // front legs
    rod("flUpperL", "leftUpperArm", down(p.upperLeg), r),
    rod("flLowerL", "leftLowerArm", down(p.lowerLeg), r),
    rod("flUpperR", "rightUpperArm", down(p.upperLeg), r),
    rod("flLowerR", "rightLowerArm", down(p.lowerLeg), r),
    // hind legs
    rod("hlUpperL", "leftUpperLeg", down(p.upperLeg), r),
    rod("hlLowerL", "leftLowerLeg", down(p.lowerLeg), r),
    rod("hlUpperR", "rightUpperLeg", down(p.upperLeg), r),
    rod("hlLowerR", "rightLowerLeg", down(p.lowerLeg), r),
    // tail: base rod joins the hips to the first tail segment (no gap)
    rod("tailBase", "hips", v(0, 0.05, -0.1), r * 0.9),
    rod("tail1", "leftLittleProximal", v(0, 0.03, -0.09), r * 0.85),
    rod("tail2", "leftLittleIntermediate", v(0, 0.015, -0.08), r * 0.75),
    rod("tail3", "leftLittleDistal", v(0, 0.005, -0.07), r * 0.65),
    // ball joints
    ball("jShoulderL", "leftUpperArm"),
    ball("jShoulderR", "rightUpperArm"),
    ball("jElbowL", "leftLowerArm"),
    ball("jElbowR", "rightLowerArm"),
    ball("jHipL", "leftUpperLeg"),
    ball("jHipR", "rightUpperLeg"),
    ball("jKneeL", "leftLowerLeg"),
    ball("jKneeR", "rightLowerLeg"),
  ];

  const skeleton: IAutoMovieSkeleton = { id: "cat", bones };
  const model: IAutoMovieModel = {
    id: "cat",
    name: "stick cat",
    origin: "generated",
    parts,
    skeleton,
    body: null,
    materials: [
      {
        id: "fur",
        name: "fur",
        baseColor: { r: 0.14, g: 0.12, b: 0.13, a: 1, hex: null },
        metallic: 0,
        roughness: 0.7,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
      {
        id: "eye",
        name: "eye",
        baseColor: { r: 0.93, g: 0.85, b: 0.4, a: 1, hex: null },
        metallic: 0,
        roughness: 0.3,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
      {
        id: "pupil",
        name: "pupil",
        baseColor: { r: 0.04, g: 0.04, b: 0.05, a: 1, hex: null },
        metallic: 0,
        roughness: 0.4,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
    asset: null,
  };
  return { skeleton, model };
};
