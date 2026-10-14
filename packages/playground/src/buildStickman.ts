import { DEFAULT_HUMANOID_ROM, aimRotation } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  AutoMoviePrimitiveShape,
  IAutoMovieBone,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IStickmanParams } from "./IStickmanParams";

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
): IAutoMovieBone => {
  // Borrow the engine's conventional joint constraints; the page's optional
  // clamp and HUMANOID_REST_FRAME determine how playback consumes them.
  const rom: IAutoMovieBone["constraint"] = DEFAULT_HUMANOID_ROM[name] ?? null;
  return {
    bone: name,
    parent,
    rest,
    constraint: rom,
  };
};

/** Shortest-arc rotation taking the local +Y axis onto a target direction. */
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

/**
 * Attach a rigid capsule along a bone-local segment. Its existing 0.01-metre minimum cylinder can extend beyond very short requested segments; orientation is delegated to aimRotation.
 */
const rod: (
  id: string,
  boneName: AutoMovieHumanoidBone,
  seg: IAutoMovieVector3,
  radius: number,
  material: string,
) => IAutoMovieModelPart = (
  id: string,
  boneName: AutoMovieHumanoidBone,
  seg: IAutoMovieVector3,
  radius: number,
  material: string,
): IAutoMovieModelPart => {
  const length: number = Math.hypot(seg.x, seg.y, seg.z);
  return {
    id,
    name: id,
    geometry: { type: "primitive", shape: capsule(radius, length) },
    material,
    attachedBone: boneName,
    transform: at(v(seg.x / 2, seg.y / 2, seg.z / 2), yToDir(seg)),
  };
};

/**
 * Build a conventional rigid rod/sphere figure in local +Y-up/+Z-forward metres, with arms extending along ±X at rest. Seventeen named humanoid bones carry thirty-three primitive parts; the partial rig is not a complete normalized VRM or continuous anatomical skin. Returned model/skeleton share one skeleton wrapper, and the page/viewer own playback, primitive upload and disposal.
 *
 * Joint constraints are borrowed from the engine's default table; their presence does not validate these proportions or force playback clamping. The existing stickman page enables clamping only when requested and supplies its humanoid rest-frame mapping. Capsule cylinder length has a 0.01-metre minimum, so short segments can exceed authored endpoints; joint spheres intentionally cover rod joints rather than forming shared surface boundaries.
 *
 * @evidence contracts/common.md#principled-implementation Deterministic rest transforms, canonical aimRotation and rigid bone attachments construct the fixed part graph; unit conversion is unnecessary because all authored lengths already use model metres.
 * @evidence contracts/common.md#clear-and-simple-design Local transform/rod/ball helpers expose each fixed part and parent bone directly, leaving FK, optional constraint clamping and renderer lifetime to ordinary consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed palette/ratios, cylinder minimum and overlapping joint spheres are conventional demo representation choices, not measured anatomy. Missing positivity/combination admission and incomplete VRM normalization remain disclosed.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies units/frame, exact fixed populations, borrowed constraints, optional clamp consumption and capsule/shared-boundary limits without claiming observed appearance.
 * @evidence contracts/performance.md#efficient-algorithms Seventeen bones and thirty-three parts bound assembly work/storage; actual primitive tessellation, GPU upload and per-frame FK retain their viewer/engine costs beyond this document producer.
 * @evidence contracts/performance.md#reuse-equivalent-work One skeleton wrapper is shared by the two returned references and default joint constraints are borrowed from the canonical engine table; each call creates fresh model/bone/part arrays rather than caching mutable actors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned documents and must not mutate borrowed engine constraint records, whose immutability is a consumer premise rather than runtime enforcement. No GPU handle, timer or worker is acquired; page/viewer consumers dispose superseded uploads and retain model data for their actor lifetime.
 *
 * @author Samchon
 */
export const buildStickman: (p: IStickmanParams) => {
  /** Caller-owned rig wrapper shared with model.skeleton; constraint rows borrow the engine's default table. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh rigid primitive document, whose later realized geometry/materials require caller retirement. */
  model: IAutoMovieModel;
} = (
  p: IStickmanParams,
): {
  /** Caller-owned rig wrapper shared with model.skeleton; constraint rows borrow the engine's default table. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh rigid primitive document, whose later realized geometry/materials require caller retirement. */
  model: IAutoMovieModel;
} => {
  const bones: IAutoMovieBone[] = [
    bone("hips", null, at(v(0, p.hipHeight, 0))),
    bone("spine", "hips", at(v(0, p.pelvisToSpine, 0))),
    bone("chest", "spine", at(v(0, p.spineToChest, 0))),
    bone("neck", "chest", at(v(0, p.chestToNeck, 0))),
    bone("head", "neck", at(v(0, p.neckLength, 0))),
    // arms (root → tip), extending along ±X (T-pose)
    bone("leftUpperArm", "chest", at(v(p.shoulderHalf, p.shoulderRise, 0))),
    bone("leftLowerArm", "leftUpperArm", at(v(p.upperArm, 0, 0))),
    bone("leftHand", "leftLowerArm", at(v(p.lowerArm, 0, 0))),
    bone("rightUpperArm", "chest", at(v(-p.shoulderHalf, p.shoulderRise, 0))),
    bone("rightLowerArm", "rightUpperArm", at(v(-p.upperArm, 0, 0))),
    bone("rightHand", "rightLowerArm", at(v(-p.lowerArm, 0, 0))),
    // legs (root → tip), extending along −Y
    bone("leftUpperLeg", "hips", at(v(p.hipHalf, 0, 0))),
    bone("leftLowerLeg", "leftUpperLeg", at(v(0, -p.thigh, 0))),
    bone("leftFoot", "leftLowerLeg", at(v(0, -p.shin, 0))),
    bone("rightUpperLeg", "hips", at(v(-p.hipHalf, 0, 0))),
    bone("rightLowerLeg", "rightUpperLeg", at(v(0, -p.thigh, 0))),
    bone("rightFoot", "rightLowerLeg", at(v(0, -p.shin, 0))),
  ];

  const r: number = p.rodRadius;
  const tr: number = p.torsoRadius;
  /** A sphere of arbitrary radius attached at a bone's origin (fists, etc.). */
  const knob: (
    id: string,
    boneName: AutoMovieHumanoidBone,
    radius: number,
    material?: string,
    offset?: IAutoMovieVector3,
  ) => IAutoMovieModelPart = (
    id: string,
    boneName: AutoMovieHumanoidBone,
    radius: number,
    material: string = "ink",
    offset: IAutoMovieVector3 = v(0, 0, 0),
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: { type: "primitive", shape: { type: "sphere", radius } },
    material,
    attachedBone: boneName,
    transform: at(offset),
  });
  /** A ball joint: a sphere at a bone's origin, hiding the gap between rods. */
  const ball: (
    id: string,
    boneName: AutoMovieHumanoidBone,
  ) => IAutoMovieModelPart = (
    id: string,
    boneName: AutoMovieHumanoidBone,
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: {
      type: "primitive",
      shape: { type: "sphere", radius: r * 1.35 },
    },
    material: "ink",
    attachedBone: boneName,
    transform: at(v(0, 0, 0)),
  });

  const parts: IAutoMovieModelPart[] = [
    // torso column, one rod per spine bone so it bends with the back (thicker
    // than the limbs, tapering up the neck)
    rod("spineRod", "hips", v(0, p.pelvisToSpine, 0), tr, "ink"),
    rod("chestRod", "spine", v(0, p.spineToChest, 0), tr, "ink"),
    rod("neckBase", "chest", v(0, p.chestToNeck, 0), tr * 0.7, "ink"),
    rod("neckRod", "neck", v(0, p.neckLength, 0), tr * 0.55, "ink"),
    {
      id: "head",
      name: "head",
      geometry: {
        type: "primitive",
        shape: { type: "sphere", radius: p.headRadius },
      },
      material: "ink",
      attachedBone: "head",
      transform: at(v(0, p.headRadius, 0)),
    },
    // a face on the front (+Z) of the head so its facing direction is never
    // ambiguous: two big eyes, dark pupils inside them, and a small nose nub
    knob(
      "eyeL",
      "head",
      p.headRadius * 0.34,
      "eye",
      v(p.headRadius * 0.4, p.headRadius * 1.08, p.headRadius * 0.86),
    ),
    knob(
      "eyeR",
      "head",
      p.headRadius * 0.34,
      "eye",
      v(-p.headRadius * 0.4, p.headRadius * 1.08, p.headRadius * 0.86),
    ),
    knob(
      "pupilL",
      "head",
      p.headRadius * 0.15,
      "pupil",
      v(p.headRadius * 0.42, p.headRadius * 1.06, p.headRadius * 1.12),
    ),
    knob(
      "pupilR",
      "head",
      p.headRadius * 0.15,
      "pupil",
      v(-p.headRadius * 0.42, p.headRadius * 1.06, p.headRadius * 1.12),
    ),
    knob(
      "nose",
      "head",
      p.headRadius * 0.2,
      "ink",
      v(0, p.headRadius * 0.8, p.headRadius * 1.12),
    ),
    // clavicles, connect the spine column to each shoulder socket
    rod("clavicleL", "chest", v(p.shoulderHalf, p.shoulderRise, 0), r, "ink"),
    rod("clavicleR", "chest", v(-p.shoulderHalf, p.shoulderRise, 0), r, "ink"),
    // arms
    rod("armUpperL", "leftUpperArm", v(p.upperArm, 0, 0), r, "ink"),
    rod("armLowerL", "leftLowerArm", v(p.lowerArm, 0, 0), r, "ink"),
    rod("armUpperR", "rightUpperArm", v(-p.upperArm, 0, 0), r, "ink"),
    rod("armLowerR", "rightLowerArm", v(-p.lowerArm, 0, 0), r, "ink"),
    // legs
    rod("legUpperL", "leftUpperLeg", v(0, -p.thigh, 0), r, "ink"),
    rod("legLowerL", "leftLowerLeg", v(0, -p.shin, 0), r, "ink"),
    rod("legUpperR", "rightUpperLeg", v(0, -p.thigh, 0), r, "ink"),
    rod("legLowerR", "rightLowerLeg", v(0, -p.shin, 0), r, "ink"),
    // ball joints, pelvis, shoulders, elbows, hips, knees
    ball("jointHip", "hips"),
    ball("jointShoulderL", "leftUpperArm"),
    ball("jointShoulderR", "rightUpperArm"),
    ball("jointElbowL", "leftLowerArm"),
    ball("jointElbowR", "rightLowerArm"),
    ball("jointHipL", "leftUpperLeg"),
    ball("jointHipR", "rightUpperLeg"),
    ball("jointKneeL", "leftLowerLeg"),
    ball("jointKneeR", "rightLowerLeg"),
    // fists, round caps at the wrists (so punches land with a visible hand)
    knob("fistL", "leftHand", p.fistRadius),
    knob("fistR", "rightHand", p.fistRadius),
    // feet, short rods off each ankle pointing forward (+Z) so the figure
    // stands on something instead of tapering to a point
    rod("footL", "leftFoot", v(0, 0, p.headRadius * 1.1), r * 1.1, "ink"),
    rod("footR", "rightFoot", v(0, 0, p.headRadius * 1.1), r * 1.1, "ink"),
  ];

  const skeleton: IAutoMovieSkeleton = { id: "stickman", bones };
  const model: IAutoMovieModel = {
    id: "stickman",
    name: "stick figure",
    origin: "generated",
    parts,
    skeleton,
    body: null,
    materials: [
      {
        id: "ink",
        name: "ink",
        baseColor: { r: 0.09, g: 0.1, b: 0.12, a: 1, hex: null },
        metallic: 0,
        roughness: 0.6,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
      {
        id: "eye",
        name: "eye",
        baseColor: { r: 0.95, g: 0.96, b: 0.98, a: 1, hex: null },
        metallic: 0,
        roughness: 0.35,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
      {
        id: "pupil",
        name: "pupil",
        baseColor: { r: 0.05, g: 0.06, b: 0.09, a: 1, hex: null },
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
