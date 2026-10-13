import { aimRotation } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMoviePrimitiveShape, IAutoMovieBone, IAutoMovieJointConstraint, IAutoMovieModel, IAutoMovieModelPart, IAutoMovieQuaternion, IAutoMovieSkeleton, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import type { IHorseParams } from "./IHorseParams";
import { HORSE_ROM } from "./HORSE_ROM";

const mat: (id: string, r: number, g: number, b: number) => IAutoMovieModel["materials"][number] = (id: string, r: number, g: number, b: number): IAutoMovieModel["materials"][number] => ({
  id,
  name: id,
  baseColor: { r, g, b, a: 1, hex: null },
  metallic: 0,
  roughness: 0.6,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
});

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

const at: (t: IAutoMovieVector3, r?: IAutoMovieQuaternion) => IAutoMovieTransform = (
  t: IAutoMovieVector3,
  r?: IAutoMovieQuaternion,
): IAutoMovieTransform => ({
  translation: t,
  rotation: r ?? { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const bone: (name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, rest: IAutoMovieTransform) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  rest: IAutoMovieTransform,
): IAutoMovieBone => ({
  bone: name,
  parent,
  rest,
  constraint: HORSE_ROM[name] ?? null,
});

const yToDir: (dir: IAutoMovieVector3) => IAutoMovieQuaternion = (dir: IAutoMovieVector3): IAutoMovieQuaternion =>
  aimRotation({ x: 0, y: 1, z: 0 }, dir);

const capsule: (radius: number, length: number) => AutoMoviePrimitiveShape = (radius: number, length: number): AutoMoviePrimitiveShape => ({
  type: "capsule",
  radius,
  height: Math.max(0.01, length - 2 * radius),
});

const rod: (id: string, boneName: AutoMovieHumanoidBone, seg: IAutoMovieVector3, radius: number, material?: string) => IAutoMovieModelPart = (
  id: string,
  boneName: AutoMovieHumanoidBone,
  seg: IAutoMovieVector3,
  radius: number,
  material: string = "hide",
): IAutoMovieModelPart => ({
  id,
  name: id,
  geometry: {
    type: "primitive",
    shape: capsule(radius, Math.hypot(seg.x, seg.y, seg.z)),
  },
  material,
  attachedBone: boneName,
  transform: at(v(seg.x / 2, seg.y / 2, seg.z / 2), yToDir(seg)),
});

/**
 * Construct twenty closed-enum bones and 40 rigid primitive parts in +Y-up/+Z-forward metres. Arms are front legs, legs are hind legs and the little-finger chain is the tail; the existing quadruped pages leave rest-frame/axis overrides undefined to retain raw rig-space interpretation. Neck/head offsets remain fixed at (0,0.34,0.26) and (0,0.12,0.2) metres; the spine attachment is consumed as the saddle by the existing rider pages. Model and returned skeleton share one wrapper. This disconnected rod/sphere/cone representation and overlapping joint spheres are not continuous anatomical skin; capsule cylinders retain a 0.01-metre minimum and may exceed short segments.
 *
 * @evidence contracts/common.md#principled-implementation Explicit parent/rest transforms and canonical aimRotation place the fixed rods and other primitives deterministically, with all authored lengths already in metres.
 * @evidence contracts/common.md#clear-and-simple-design Local literal helpers expose each horse part; canonical engine FK and viewer primitive upload remain downstream responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed offsets, palette, rod overlaps and HORSE_ROM are conventional demo choices, not measured anatomy. Positivity/combined-shape admission and actual displayed health remain unproven.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the actual units, consumer, ownership and unverified boundaries of this declaration.
 * @evidence contracts/performance.md#efficient-algorithms Twenty bones and 40 parts bound document assembly; viewer tessellation, GPU upload and per-frame FK retain their own costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One skeleton wrapper serves both returned references and constraints alias HORSE_ROM; fresh actor/model arrays are allocated per call to preserve independently mutable instances.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned documents and must not mutate borrowed HORSE_ROM rows; this builder acquires no worker, GPU handle, timer or cross-call cache. Page/viewer consumers own uploaded resources.
 *
 * @author Samchon
 */
export const buildHorse: (p: IHorseParams) => { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; } = (
  p: IHorseParams,
): { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } => {
  const H: number = p.backHeight;
  const t1: number = p.trunkLength * 0.5; // hips→spine and spine→chest
  const lh: number = p.legHalf;
  const down: (len: number) => IAutoMovieVector3 = (len: number): IAutoMovieVector3 => v(0, -len, 0);
  // neck rises up-and-forward from the chest; head continues that line
  const neckSeg: IAutoMovieVector3 = v(0, 0.34, 0.26);
  const headSeg: IAutoMovieVector3 = v(0, 0.12, 0.2);

  const bones: IAutoMovieBone[] = [
    bone("hips", null, at(v(0, H, 0))),
    bone("spine", "hips", at(v(0, 0, t1))),
    bone("chest", "spine", at(v(0, 0, t1))),
    bone("neck", "chest", at(neckSeg)),
    bone("head", "neck", at(headSeg)),
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
    // long tail (repurposed finger chain), trailing down-and-back from the hips
    bone("leftLittleProximal", "hips", at(v(0, 0.04, -0.16))),
    bone(
      "leftLittleIntermediate",
      "leftLittleProximal",
      at(v(0, -0.06, -0.18)),
    ),
    bone("leftLittleDistal", "leftLittleIntermediate", at(v(0, -0.12, -0.16))),
  ];

  const r: number = p.rodRadius;
  const tr: number = p.trunkRadius;
  const knob: (id: string, boneName: AutoMovieHumanoidBone, radius: number, material: string, offset: IAutoMovieVector3) => IAutoMovieModelPart = (
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
  const ball: (id: string, boneName: AutoMovieHumanoidBone, radius?: number) => IAutoMovieModelPart = (
    id: string,
    boneName: AutoMovieHumanoidBone,
    radius: number = r * 1.2,
  ): IAutoMovieModelPart => knob(id, boneName, radius, "hide", v(0, 0, 0));
  const cone: (id: string, boneName: AutoMovieHumanoidBone, offset: IAutoMovieVector3, height: number, rot: IAutoMovieQuaternion) => IAutoMovieModelPart = (
    id: string,
    boneName: AutoMovieHumanoidBone,
    offset: IAutoMovieVector3,
    height: number,
    rot: IAutoMovieQuaternion,
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: {
      type: "primitive",
      shape: { type: "cone", radius: height * 0.45, height },
    },
    material: "hide",
    attachedBone: boneName,
    transform: at(offset, rot),
  });

  const parts: IAutoMovieModelPart[] = [
    // barrel + neck + head stalk
    rod("barrelRear", "hips", v(0, 0, t1), tr),
    rod("barrelFront", "spine", v(0, 0, t1), tr),
    rod("neckRod", "chest", neckSeg, tr * 0.72),
    rod("headStalk", "neck", headSeg, tr * 0.5),
    knob("head", "head", p.headRadius, "hide", v(0, 0.02, 0.04)),
    // muzzle: a smaller sphere out the front of the head
    knob(
      "muzzle",
      "head",
      p.headRadius * 0.62,
      "hide",
      v(0, -0.04, p.headRadius * 1.05),
    ),
    // ears
    cone(
      "earL",
      "head",
      v(0.06, p.headRadius * 0.95, -0.02),
      0.12,
      yToDir(v(0.2, 1, -0.1)),
    ),
    cone(
      "earR",
      "head",
      v(-0.06, p.headRadius * 0.95, -0.02),
      0.12,
      yToDir(v(-0.2, 1, -0.1)),
    ),
    // eyes with pupils
    knob(
      "eyeL",
      "head",
      p.headRadius * 0.24,
      "eye",
      v(0.1, 0.05, p.headRadius * 0.6),
    ),
    knob(
      "eyeR",
      "head",
      p.headRadius * 0.24,
      "eye",
      v(-0.1, 0.05, p.headRadius * 0.6),
    ),
    knob(
      "pupilL",
      "head",
      p.headRadius * 0.11,
      "pupil",
      v(0.11, 0.05, p.headRadius * 0.78),
    ),
    knob(
      "pupilR",
      "head",
      p.headRadius * 0.11,
      "pupil",
      v(-0.11, 0.05, p.headRadius * 0.78),
    ),
    // mane: a row of plates riding the neck
    knob(
      "mane1",
      "neck",
      tr * 0.5,
      "mane",
      v(0, neckSeg.y * 0.25, neckSeg.z * 0.25 - 0.06),
    ),
    knob(
      "mane2",
      "neck",
      tr * 0.5,
      "mane",
      v(0, neckSeg.y * 0.55, neckSeg.z * 0.55 - 0.06),
    ),
    knob(
      "mane3",
      "neck",
      tr * 0.45,
      "mane",
      v(0, neckSeg.y * 0.82, neckSeg.z * 0.82 - 0.05),
    ),
    knob(
      "forelock",
      "head",
      p.headRadius * 0.4,
      "mane",
      v(0, p.headRadius * 0.9, -0.04),
    ),
    // front legs
    rod("flUpperL", "leftUpperArm", down(p.upperLeg), r),
    rod("flLowerL", "leftLowerArm", down(p.lowerLeg), r * 0.82),
    rod("flUpperR", "rightUpperArm", down(p.upperLeg), r),
    rod("flLowerR", "rightLowerArm", down(p.lowerLeg), r * 0.82),
    // hind legs
    rod("hlUpperL", "leftUpperLeg", down(p.upperLeg), r),
    rod("hlLowerL", "leftLowerLeg", down(p.lowerLeg), r * 0.82),
    rod("hlUpperR", "rightUpperLeg", down(p.upperLeg), r),
    rod("hlLowerR", "rightLowerLeg", down(p.lowerLeg), r * 0.82),
    // hooves: dark caps at each lower-leg tip
    knob("hoofFL", "leftHand", r * 0.95, "hoof", v(0, 0, 0)),
    knob("hoofFR", "rightHand", r * 0.95, "hoof", v(0, 0, 0)),
    knob("hoofHL", "leftFoot", r * 0.95, "hoof", v(0, 0, 0)),
    knob("hoofHR", "rightFoot", r * 0.95, "hoof", v(0, 0, 0)),
    // tail: base rod joins the hips to the first tail segment (mane-coloured)
    rod("tailBase", "hips", v(0, 0.04, -0.16), r * 0.8, "mane"),
    rod("tail1", "leftLittleProximal", v(0, -0.06, -0.18), r * 0.7, "mane"),
    rod("tail2", "leftLittleIntermediate", v(0, -0.12, -0.16), r * 0.6, "mane"),
    rod("tail3", "leftLittleDistal", v(0, -0.12, -0.12), r * 0.5, "mane"),
    // ball joints at the limb roots/knees
    ball("jShoulderL", "leftUpperArm"),
    ball("jShoulderR", "rightUpperArm"),
    ball("jElbowL", "leftLowerArm", r * 0.9),
    ball("jElbowR", "rightLowerArm", r * 0.9),
    ball("jHipL", "leftUpperLeg"),
    ball("jHipR", "rightUpperLeg"),
    ball("jKneeL", "leftLowerLeg", r * 0.9),
    ball("jKneeR", "rightLowerLeg", r * 0.9),
  ];

  const skeleton: IAutoMovieSkeleton = { id: "horse", bones };
  const model: IAutoMovieModel = {
    id: "horse",
    name: "stick horse",
    origin: "generated",
    parts,
    skeleton,
    body: null,
    materials: [
      mat("hide", 0.35, 0.24, 0.14),
      mat("mane", 0.12, 0.08, 0.05),
      mat("hoof", 0.08, 0.07, 0.06),
      { ...mat("eye", 0.95, 0.96, 0.98), roughness: 0.3 },
      mat("pupil", 0.04, 0.04, 0.05),
    ],
    asset: null,
  };
  return { skeleton, model };
};
