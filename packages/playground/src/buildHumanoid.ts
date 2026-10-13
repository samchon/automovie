import type { IHumanoidParams } from "./IHumanoidParams";
import { Quaternion } from "@automovie/engine";
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
): IAutoMovieBone => ({ bone: name, parent, rest, constraint: null });

/** Shortest-arc rotation taking the local +Y axis onto a target direction. */
const yToDir: (dir: IAutoMovieVector3) => IAutoMovieQuaternion = (dir: IAutoMovieVector3): IAutoMovieQuaternion => {
  const len: number = Math.hypot(dir.x, dir.y, dir.z);
  if (len === 0) return { x: 0, y: 0, z: 0, w: 1 };
  const n: IAutoMovieVector3 = v(dir.x / len, dir.y / len, dir.z / len);
  const dot: number = n.y; // dot(+Y, n)
  if (dot > 0.999999) return { x: 0, y: 0, z: 0, w: 1 };
  // Antiparallel: 180° about any axis ⟂ Y: use +Z.
  if (dot < -0.999999) return { x: 0, y: 0, z: 1, w: 0 };
  // axis = cross(+Y, n); angle from dot.
  const axis: IAutoMovieVector3 = v(n.z, 0, -n.x); // cross((0,1,0), n)
  return Quaternion.normalize(
    Quaternion.fromAxisAngle(axis, (Math.acos(dot) * 180) / Math.PI),
  );
};

const capsule: (radius: number, height: number) => AutoMoviePrimitiveShape = (radius: number, height: number): AutoMoviePrimitiveShape => ({
  type: "capsule",
  radius,
  height: Math.max(0.01, height - 2 * radius),
});

/**
 * A rigid limb segment: a capsule attached to `boneName`, spanning from that
 * bone toward its child along `seg` (a local offset vector), so it rides the
 * bone and bends with articulation.
 */
const segment: (id: string, boneName: AutoMovieHumanoidBone, seg: IAutoMovieVector3, radius: number, material: string) => IAutoMovieModelPart = (
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

const blob: (id: string, boneName: AutoMovieHumanoidBone, shape: AutoMoviePrimitiveShape, offset: IAutoMovieVector3, material: string) => IAutoMovieModelPart = (
  id: string,
  boneName: AutoMovieHumanoidBone,
  shape: AutoMoviePrimitiveShape,
  offset: IAutoMovieVector3,
  material: string,
): IAutoMovieModelPart => ({
  id,
  name: id,
  geometry: { type: "primitive", shape },
  material,
  attachedBone: boneName,
  transform: at(offset),
});

/**
 * Build a conventional block figure from authored metre proportions in local +Y-up/+Z-forward coordinates. Seventeen named humanoid bones carry twelve rigid primitive parts; this is neither a complete normalized VRM rig nor continuous anatomical skin. The editor rebuilds it on proportion changes, and ordinary engine/viewer owners articulate and upload the returned document.
 *
 * Limb capsules rotate local +Y toward each segment. Zero direction returns identity, nearly parallel directions use identity and nearly opposite directions use a half-turn about +Z; the existing 0.999999 thresholds approximate those limiting orientations. Capsule cylindrical height has an existing 0.01-metre minimum, so sufficiently short limbs do not match their requested end-to-end length. Other values and combinations receive no builder admission.
 *
 * @evidence contracts/common.md#principled-implementation Deterministic rest transforms and rigid bone attachments compose a fixed primitive model; shortest-arc direction handling retains its documented degeneracies, precision thresholds and minimum cylinder-height limitation.
 * @evidence contracts/common.md#clear-and-simple-design Local vector/transform/part helpers expose fixed bone and part assembly directly; rendering, FK and editor history remain existing consumers' responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored ratios, palette and capsule minimum are conventional demonstration choices, not measured anatomy. Missing positivity/combined-body admission and independently authored hip/leg height remain limitations rather than fabricated clinical correctness.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies units/frame, partial rigid rig, limiting rotations and the capsule minimum without claiming visually verified output.
 * @evidence contracts/performance.md#efficient-algorithms Seventeen bones and twelve parts bound assembly work/storage independently of proportion values; the renderer's primitive tessellation and GPU upload costs occur later and are not excluded by this fixed-size producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each editor rebuild returns fresh mutable model/bone/part data for new proportions; the builder retains no model cache or GPU resource.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned skeleton/model data belong to the page and share the returned model's skeleton reference. No worker, timer or renderer is acquired; the viewer/page must dispose uploads from superseded models.
 *
 * @author Samchon
 */
export const buildHumanoid: (p: IHumanoidParams) => { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } = (
  p: IHumanoidParams,
): { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } => {
  const spineLen: number = p.torsoLength * 0.4;
  const chestLen: number = p.torsoLength * 0.35;
  const armY: number = p.torsoLength * 0.25; // shoulder height above chest origin
  const sx: number = p.shoulderWidth / 2;
  const hx: number = p.hipWidth / 2;

  const bones: IAutoMovieBone[] = [
    bone("hips", null, at(v(0, p.hipHeight, 0))),
    bone("spine", "hips", at(v(0, spineLen * 0.5, 0))),
    bone("chest", "spine", at(v(0, spineLen, 0))),
    bone("neck", "chest", at(v(0, chestLen, 0))),
    bone("head", "neck", at(v(0, p.neckLength, 0))),
    // arms (root → tip), extending along ±X
    bone("leftUpperArm", "chest", at(v(sx, armY, 0))),
    bone("leftLowerArm", "leftUpperArm", at(v(p.upperArmLength, 0, 0))),
    bone("leftHand", "leftLowerArm", at(v(p.lowerArmLength, 0, 0))),
    bone("rightUpperArm", "chest", at(v(-sx, armY, 0))),
    bone("rightLowerArm", "rightUpperArm", at(v(-p.upperArmLength, 0, 0))),
    bone("rightHand", "rightLowerArm", at(v(-p.lowerArmLength, 0, 0))),
    // legs (root → tip), extending along −Y
    bone("leftUpperLeg", "hips", at(v(hx, 0, 0))),
    bone("leftLowerLeg", "leftUpperLeg", at(v(0, -p.thighLength, 0))),
    bone("leftFoot", "leftLowerLeg", at(v(0, -p.shinLength, 0))),
    bone("rightUpperLeg", "hips", at(v(-hx, 0, 0))),
    bone("rightLowerLeg", "rightUpperLeg", at(v(0, -p.thighLength, 0))),
    bone("rightFoot", "rightLowerLeg", at(v(0, -p.shinLength, 0))),
  ];

  const r: number = p.limbRadius;
  const foot: AutoMoviePrimitiveShape = {
    type: "box",
    width: r * 1.6,
    height: r * 0.8,
    depth: r * 3,
  };
  const parts: IAutoMovieModelPart[] = [
    blob(
      "torso",
      "chest",
      { type: "capsule", radius: r * 2.2, height: p.torsoLength * 0.5 },
      v(0, chestLen * 0.1, 0),
      "skin",
    ),
    blob(
      "head",
      "head",
      { type: "sphere", radius: p.headRadius },
      v(0, p.headRadius, 0),
      "skin",
    ),
    segment("armUpperL", "leftUpperArm", v(p.upperArmLength, 0, 0), r, "skin"),
    segment("armLowerL", "leftLowerArm", v(p.lowerArmLength, 0, 0), r, "skin"),
    segment(
      "armUpperR",
      "rightUpperArm",
      v(-p.upperArmLength, 0, 0),
      r,
      "skin",
    ),
    segment(
      "armLowerR",
      "rightLowerArm",
      v(-p.lowerArmLength, 0, 0),
      r,
      "skin",
    ),
    segment(
      "legUpperL",
      "leftUpperLeg",
      v(0, -p.thighLength, 0),
      r * 1.2,
      "skin",
    ),
    segment(
      "legLowerL",
      "leftLowerLeg",
      v(0, -p.shinLength, 0),
      r * 1.1,
      "skin",
    ),
    segment(
      "legUpperR",
      "rightUpperLeg",
      v(0, -p.thighLength, 0),
      r * 1.2,
      "skin",
    ),
    segment(
      "legLowerR",
      "rightLowerLeg",
      v(0, -p.shinLength, 0),
      r * 1.1,
      "skin",
    ),
    blob("footL", "leftFoot", foot, v(0, -r * 0.4, r), "skin"),
    blob("footR", "rightFoot", foot, v(0, -r * 0.4, r), "skin"),
  ];

  const skeleton: IAutoMovieSkeleton = { id: "humanoid", bones };
  const model: IAutoMovieModel = {
    id: "humanoid",
    name: "procedural humanoid",
    origin: "generated",
    parts,
    skeleton,
    body: null,
    materials: [
      {
        id: "skin",
        name: "skin",
        baseColor: { r: 0.85, g: 0.68, b: 0.55, a: 1, hex: null },
        metallic: 0,
        roughness: 0.7,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
    asset: null,
  };
  return { skeleton, model };
};
