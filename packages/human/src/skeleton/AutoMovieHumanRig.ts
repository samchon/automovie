import type { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieMeshSkin, IAutoMovieModelPart, IAutoMovieSkeleton } from "@automovie/interface";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanMouthBinding } from "../generation/AutoMovieHumanMouthBinding";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanRigBinding } from "./AutoMovieHumanRigBinding";
import { AutoMovieHumanRigPose } from "./AutoMovieHumanRigPose";
import { AutoMovieHumanSkinBinding } from "./AutoMovieHumanSkinBinding";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import type { AutoMovieHumanWeightField as F } from "./AutoMovieHumanWeightField";

/** The generated body's rig, continuous binding field and mesh export. */
export namespace AutoMovieHumanRig {
  /** Prepared once for one immutable body's skin and skeleton. */
  export interface IRig extends AutoMovieHumanRigBinding.IBinding {
    /** Complete rig, including optional scapular articulation. */
    skeleton: IAutoMovieSkeleton;
    /** Oral lining's posterior jaw attachment; positions are model metres. */
    bindMouthLining(positions: readonly number[]): IAutoMovieMeshSkin;
  }
  /** Full field sample and the four-influence export's discarded mass. */
  export type IField = AutoMovieHumanRigBinding.IField;
  /** Bone-local bind-to-pose transform. */
  export type ILocal = AutoMovieHumanRigPose.ILocal;
  /** Engine pose and the joints that require translation channels. */
  export type IEnginePose = AutoMovieHumanRigPose.IEnginePose;


  /**
   * Prepare the rig of one body.
   *
   * @param calibration The body.
   * @param scale Metres per calibration millimetre.
   * @returns The rig and its binder.
   */
  export function prepare(
    calibration: IAutoMovieHumanBodyCalibration,
    scale: number,
  ): IRig {
    const joints: AutoMovieHumanJointCentres.IJoint[] =
      AutoMovieHumanJointCentres.derive(calibration);
    const bones: AutoMovieHumanoidBone[] = [
      ...new Set(joints.map((j): AutoMovieHumanoidBone => named(j.bone))),
    ];
    const place = new Map<AutoMovieHumanoidBone, Vector>();
    const parentOf = new Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>();
    for (const j of joints) {
      const bone: AutoMovieHumanoidBone = named(j.bone);
      if (place.has(bone)) continue;
      place.set(bone, Math3D.times(j.position, scale));
      parentOf.set(bone, j.parent === null ? null : named(j.parent));
    }
    const byBone = new Map<string, AutoMovieHumanJointCentres.IJoint>(
      joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): [string, AutoMovieHumanJointCentres.IJoint] => [
          j.bone,
          j,
        ],
      ),
    );
    const skeleton: IAutoMovieSkeleton = {
      id: "automovie-human",
      bones: bones.map((bone: AutoMovieHumanoidBone): IAutoMovieBone => {
        const parent: AutoMovieHumanoidBone | null = parentOf.get(bone)!;
        const at: Vector = place.get(bone)!;
        const base: Vector = parent === null ? [0, 0, 0] : place.get(parent)!;
        const own: AutoMovieHumanJointCentres.IJoint = byBone.get(joint(bone))!;
        const axes: Math3D.IAxes = Math3D.boneAxes(
          own.bone,
          Math3D.unit(Math3D.sub(own.toward, own.position)),
          byBone,
        );
        return {
          bone,
          parent,
          axes: {
            flexion: vector(axes.flexion),
            abduction: vector(axes.abduction),
            twist: vector(axes.twist),
            twistPlacement: placement(bone),
          },
          rest: {
            translation: {
              x: at[0] - base[0],
              y: at[1] - base[1],
              z: at[2] - base[2],
            },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          constraint: null,
        };
      }),
    };
    const index = new Map<AutoMovieHumanoidBone, number>(
      bones.map((b: AutoMovieHumanoidBone, i: number): [AutoMovieHumanoidBone, number] => [b, i]),
    );
    const tree: F.ITree = AutoMovieHumanSkinBinding.prepare(joints, calibration, scale, index);
    const binding: AutoMovieHumanRigBinding.IBinding = AutoMovieHumanRigBinding.prepare(bones, index, tree);
    return {
      skeleton,
      ...binding,
      bindMouthLining(positions: readonly number[]): IAutoMovieMeshSkin {
        const skin: IAutoMovieMeshSkin = binding.bind(positions);
        return calibration.mouth === undefined ? skin : AutoMovieHumanMouthBinding.lining(calibration.mouth, positions, scale, skin);
      },
    };
  }



  /**
   * Give every mesh part a skin. Construction display meshes sample the same
   * place-based field, while rigid features ride one bone. This binding does
   * not pose the analytic rest-curve declarations or their derivatives.
   *
   * @param parts The model's parts, in metres.
   * @param rig The body's rig.
   * @returns The parts bound to the rig.
   */
  export function dress(
    parts: readonly IAutoMovieModelPart[],
    rig: IRig,
  ): IAutoMovieModelPart[] {
    return parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (part.geometry.type !== "mesh") return part;
      const mesh = part.geometry.mesh;
      return {
        ...part,
        geometry: {
          ...part.geometry,
          mesh: {
            ...mesh,
            skin: {
              ...(part.id === "human.mouth.lining" ? rig.bindMouthLining(mesh.positions) : rig.bind(mesh.positions, rigid(part.id))),
              method: BLEND,
            },
          },
        },
      };
    });
  }
  /** Evaluate local transforms from immutable rest data. */
  export const locals: typeof AutoMovieHumanRigPose.locals = AutoMovieHumanRigPose.locals;
  /** Identity local transforms at the generated bind. */
  export const bindLocals: typeof AutoMovieHumanRigPose.bindLocals = AutoMovieHumanRigPose.bindLocals;
  /** Carry every retained rig joint into the engine's declared axes. */
  export const enginePose: typeof AutoMovieHumanRigPose.enginePose = AutoMovieHumanRigPose.enginePose;
}
/** Model-space triple. */
type Vector = [number, number, number];


/** A tuple as an interface vector. */
function vector(v: readonly number[]): { x: number; y: number; z: number } {
  return { x: v[0]!, y: v[1]!, z: v[2]! };
}


/** Where a bone's twist sits: the forearm's is distal, as the skeleton composes it. */
function placement(bone: AutoMovieHumanoidBone): "distal" | "proximal" {
  return bone.endsWith("LowerArm") ? "distal" : "proximal";
}


/** The rig bone a Human joint folds into. */
function named(joint: string): AutoMovieHumanoidBone {
  if (joint === "atlas") return "neck";
  const side: "left" | "right" = joint.startsWith("left") ? "left" : "right";
  if (joint.endsWith("Subtalar") || joint.endsWith("Midfoot"))
    return `${side}Foot`;
  if (/Hallux|Toe\d/.test(joint)) return `${side}Toes`;
  return joint as AutoMovieHumanoidBone;
}


/** The Human joint that places a rig bone: the toes hang off the great toe's. */
function joint(bone: AutoMovieHumanoidBone): string {
  return bone.endsWith("Toes") ? bone.replace("Toes", "HalluxProximal") : bone;
}


/** The bone a rigid part rides, if it is one. */
function rigid(id: string): AutoMovieHumanoidBone | undefined {
  if (id.startsWith("human.eye.left")) return "leftEye";
  if (id.startsWith("human.eye.right")) return "rightEye";
  if (/^human\.(hair|brow|lash|eyebrow|eyelash)/.test(id)) return "head";
  // The upper teeth stand in the skull; the lower and the tongue on the
  // mandible, whose turn the tongue's own controls already allow for.
  if (/^human\.mouth\.(teeth|gum)\.upper$/.test(id)) return "head";
  if (/^human\.mouth\.((teeth|gum)\.lower|tongue)$/.test(id)) return "jaw";
  return undefined;
}
/** Production skin deformation method. */
const BLEND = "dual-quaternion" as const;
