import {
  AutoMovieHumanoidBone,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { DEFAULT_STICKMAN } from "./DEFAULT_STICKMAN";
import { buildStickman } from "./buildStickman";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

const mat: (
  id: string,
  r: number,
  g: number,
  b: number,
  roughness?: number,
  metallic?: number,
) => IAutoMovieMaterial = (
  id: string,
  r: number,
  g: number,
  b: number,
  roughness: number = 0.5,
  metallic: number = 0,
): IAutoMovieMaterial => ({
  id,
  name: id,
  baseColor: { r, g, b, a: 1, hex: null },
  metallic,
  roughness,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
});

/**
 * Dress a fresh conventional stick figure with rigid helmet/plume, shield and optional three-part lance, using authored metre offsets and a fixed palette. The `build:knight` script exports it; this producer performs no saddle placement, collision, clinical admission or visual verification itself.
 *
 * The returned model and top-level skeleton share one knight-identified skeleton wrapper and borrow the fresh stick figure's bone array. Armour consists of overlapping primitives rather than continuous shared-boundary surfaces.
 *
 * @evidence contracts/common.md#principled-implementation The canonical stick figure supplies rest bones/base parts; authored rigid attachments place props on head/right hand/left forearm and the lance flag filters exactly its three named parts.
 * @evidence contracts/common.md#clear-and-simple-design One model producer adds explicit prop parts/materials, leaving attachment resolution, motion and GPU lifetime to the existing pages and viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed prop dimensions, steel palette and approximate shield quaternion are demonstration choices rather than physical observations; primitive overlaps remain disclosed and both consumers receive the same actual skeleton identity.
 * @evidence contracts/common.md#meaningful-documentation The comment defines metre prop construction, optional lance, separate placement/render ownership and rigid representation limits.
 * @evidence contracts/performance.md#efficient-algorithms A fixed stick figure and ten extras bound assembly/filter work; primitive tessellation, animation and upload occur in the viewer and retain their full cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One fresh stick figure per call supplies all base geometry and eye/pupil materials; added model shells borrow those arrays' members and no numerical build is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned model and shared skeleton data belong to the page or GLB exporter, with no producer-owned worker/GPU/timer. Viewer consumers own upload disposal.
 */
export const buildKnight: (opts?: {
  /** Include the three-part lance unless explicitly false; helmet, plume and shield remain present. */
  lance?: boolean;
}) => {
  /** Knight-identified wrapper shared with model.skeleton, borrowing this call's fresh stick bone array. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh authored actor and prop document; its later realized resources belong to the consuming page. */
  model: IAutoMovieModel;
} = (
  opts: {
    /** Include the three-part lance unless explicitly false; helmet, plume and shield remain present. */
    lance?: boolean;
  } = {},
): {
  /** Knight-identified wrapper shared with model.skeleton, borrowing this call's fresh stick bone array. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh authored actor and prop document; its later realized resources belong to the consuming page. */
  model: IAutoMovieModel;
} => {
  const withLance: boolean = opts.lance !== false;
  const built: ReturnType<typeof buildStickman> =
    buildStickman(DEFAULT_STICKMAN);
  const skeleton: IAutoMovieSkeleton = built.skeleton;
  const model: IAutoMovieModel = built.model;
  const hr: number = DEFAULT_STICKMAN.headRadius;
  const lower: number = DEFAULT_STICKMAN.lowerArm;

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
  const at: (
    t: IAutoMovieVector3,
    rot?: IAutoMovieModelPart["transform"],
  ) => IAutoMovieTransform = (
    t: IAutoMovieVector3,
    rot?: IAutoMovieModelPart["transform"],
  ): IAutoMovieTransform => ({
    translation: t,
    rotation: rot?.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });

  const extras: IAutoMovieModelPart[] = [
    // helmet: a steel dome capping the crown (eyes stay visible below it)
    knob("helmet", "head", hr * 1.04, "steel", v(0, hr * 0.42, -0.01)),
    // nose guard: a thin steel bar down the front of the face
    {
      id: "noseGuard",
      name: "noseGuard",
      geometry: {
        type: "primitive",
        shape: {
          type: "box",
          width: hr * 0.16,
          height: hr * 1.1,
          depth: hr * 0.16,
        },
      },
      material: "steel",
      attachedBone: "head",
      transform: at(v(0, hr * 0.95, hr * 1.02)),
    },
    // plume: a red crest on top of the helmet
    knob("plume1", "head", hr * 0.34, "plume", v(0, hr * 1.7, -0.04)),
    knob("plume2", "head", hr * 0.28, "plume", v(0, hr * 1.78, -0.18)),
    knob("plume3", "head", hr * 0.22, "plume", v(0, hr * 1.7, -0.3)),
    // lance: a long shaft couched along the right hand, pointing forward (+Z)
    {
      id: "lance",
      name: "lance",
      geometry: {
        type: "primitive",
        shape: { type: "capsule", radius: 0.022, height: 1.5 },
      },
      material: "lance",
      attachedBone: "rightHand",
      transform: at(v(0, 0, 0.55 + lower)),
    },
    {
      id: "lanceTip",
      name: "lanceTip",
      geometry: {
        type: "primitive",
        shape: { type: "cone", radius: 0.05, height: 0.16 },
      },
      material: "steel",
      attachedBone: "rightHand",
      transform: at(v(0, 0, 1.33 + lower)),
    },
    {
      id: "lanceGrip",
      name: "lanceGrip",
      geometry: { type: "primitive", shape: { type: "sphere", radius: 0.06 } },
      material: "lance",
      attachedBone: "rightHand",
      transform: at(v(0, 0, -0.14 + lower)),
    },
    // shield: a rounded plate on the left forearm, facing out (−X / forward)
    {
      id: "shield",
      name: "shield",
      geometry: {
        type: "primitive",
        shape: { type: "cylinder", radius: 0.18, height: 0.04 },
      },
      material: "shield",
      attachedBone: "leftLowerArm",
      transform: {
        translation: v(lower * 0.5, 0, 0.06),
        // lay the disc flat against the forearm, facing forward
        rotation: { x: 0.7071, y: 0, z: 0, w: 0.7071 },
        scale: { x: 1, y: 1, z: 1 },
      },
    },
    knob("shieldBoss", "leftLowerArm", 0.045, "steel", v(lower * 0.5, 0, 0.12)),
  ];

  // recolour the figure: ink (rods/joints) → steel-blue; keep eye/pupil; add
  // the plume / lance / shield palette
  const materials: IAutoMovieMaterial[] = [
    mat("ink", 0.46, 0.5, 0.56, 0.45, 0.2), // armoured steel-blue body
    ...model.materials.filter(
      (m: IAutoMovieMaterial): boolean => m.id === "eye" || m.id === "pupil",
    ),
    mat("steel", 0.62, 0.66, 0.72, 0.35, 0.4),
    mat("plume", 0.74, 0.12, 0.12, 0.5),
    mat("lance", 0.4, 0.26, 0.13, 0.6),
    mat("shield", 0.2, 0.28, 0.5, 0.4),
  ];
  const knightSkeleton: IAutoMovieSkeleton = { ...skeleton, id: "knight" };

  return {
    skeleton: knightSkeleton,
    model: {
      ...model,
      skeleton: knightSkeleton,
      id: "knight",
      name: "knight",
      parts: [
        ...model.parts,
        ...extras.filter(
          (p: IAutoMovieModelPart): boolean =>
            withLance || !["lance", "lanceTip", "lanceGrip"].includes(p.id),
        ),
      ],
      materials,
    },
  };
};
