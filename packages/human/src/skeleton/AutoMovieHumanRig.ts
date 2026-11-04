import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMeshSkin,
  IAutoMovieModelPart,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBindingTree } from "./IAutoMovieHumanBindingTree";
import { AutoMovieHumanBindingInfluence } from "./AutoMovieHumanBindingInfluence";
import { AutoMovieHumanBindingLoft } from "./AutoMovieHumanBindingLoft";
import { AutoMovieHumanBindingInputs } from "./AutoMovieHumanBindingInputs";
import { AutoMovieHumanBindingTree } from "./AutoMovieHumanBindingTree";
import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanRigBones } from "./AutoMovieHumanRigBones";
import { AutoMovieHumanRigPose } from "./AutoMovieHumanRigPose";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The engine rig of a generated Human, and its skin binding.
 *
 * The Human skeleton has joints the humanoid vocabulary lacks; each folds into
 * the nearest named bone that carries it ({@link AutoMovieHumanRigBones}), so
 * the rig stays the shared vocabulary while the clinical skeleton keeps its
 * own joints.
 *
 * A vertex's weights are a function of its place alone. Parts are tessellated
 * apart and their seams hold copies of one physical point, so a binding read
 * from a part or a chain would give those copies different weights and open
 * the seam under any pose. Here equal places get equal weights.
 *
 * The rig only composes its pieces: the binding inputs a body gives
 * ({@link AutoMovieHumanBindingInputs}), the tree of cuts grown from them
 * ({@link AutoMovieHumanBindingTree}, with one piece per joint region), the
 * influence of that tree on a place ({@link AutoMovieHumanBindingInfluence})
 * and the rig's poses ({@link AutoMovieHumanRigPose}).
 */
export namespace AutoMovieHumanRig {
  /** A prepared rig. */
  export interface IRig {
    /** The rig the model carries. */
    skeleton: IAutoMovieSkeleton;

    /**
     * Bind a mesh's vertices.
     *
     * @param positions Vertices in metres, grouped in threes.
     * @param bone Bind every vertex to this bone alone, for a rigid part.
     * @param coordinates The vertices' loft coordinates `[chain, station,
     *   phase]`, three per vertex: a vertex that has them takes its chain's
     *   binding there (`AutoMovieHumanBindingLoft`); one whose chain or station
     *   is NaN is read at its place.
     * @returns Four influences per vertex.
     */
    bind(
      positions: readonly number[],
      bone?: AutoMovieHumanoidBone,
      coordinates?: readonly number[],
    ): IAutoMovieMeshSkin;
  }

  /** One bone's transform in its parent's frame, metres. */
  export type ILocal = AutoMovieHumanRigPose.ILocal;

  /** An engine pose with what it could not carry. */
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
    return fromInputs(AutoMovieHumanBindingInputs.derive(calibration, scale), calibration.chains);
  }

  /**
   * Prepare the rig of one body from its fixed binding inputs alone.
   *
   * @param inputs The body's binding inputs.
   * @param chains The calibration's chains in mm, whose parameters a vertex's
   *   loft coordinates name; empty binds every vertex at its place.
   * @returns The rig and its binder.
   */
  export function fromInputs(
    inputs: AutoMovieHumanBindingInputs.IInputs,
    chains: readonly IAutoMovieHumanLoftChain[] = [],
  ): IRig {
    const scale: number = inputs.scale;
    const joints: AutoMovieHumanJointCentres.IJoint[] = inputs.joints;
    const bones: AutoMovieHumanoidBone[] = [
      ...new Set(
        joints.map(
          (j: AutoMovieHumanJointCentres.IJoint): AutoMovieHumanoidBone =>
            AutoMovieHumanRigBones.named(j.bone),
        ),
      ),
    ];
    const place: Map<AutoMovieHumanoidBone, Math3D.Vector> = new Map();
    const parentOf: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
      new Map();
    for (const j of joints) {
      const bone: AutoMovieHumanoidBone = AutoMovieHumanRigBones.named(j.bone);
      if (place.has(bone)) continue;
      place.set(bone, Math3D.times(j.position, scale));
      parentOf.set(
        bone,
        j.parent === null ? null : AutoMovieHumanRigBones.named(j.parent),
      );
    }
    const byBone: Map<string, AutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          j: AutoMovieHumanJointCentres.IJoint,
        ): [string, AutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    const skeleton: IAutoMovieSkeleton = {
      id: "automovie-human",
      bones: bones.map((bone: AutoMovieHumanoidBone): IAutoMovieBone => {
        const parent: AutoMovieHumanoidBone | null = parentOf.get(bone)!;
        const at: Math3D.Vector = place.get(bone)!;
        const base: Math3D.Vector =
          parent === null ? [0, 0, 0] : place.get(parent)!;
        const own: AutoMovieHumanJointCentres.IJoint = byBone.get(
          AutoMovieHumanRigBones.joint(bone),
        )!;
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
            twistPlacement: AutoMovieHumanRigBones.placement(bone),
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
    const index: Map<AutoMovieHumanoidBone, number> = new Map(
      bones.map((b: AutoMovieHumanoidBone, i: number): [AutoMovieHumanoidBone, number] => [
        b,
        i,
      ]),
    );
    const tree: IAutoMovieHumanBindingTree = AutoMovieHumanBindingTree.grow(
      inputs,
      (bone: string): number => index.get(AutoMovieHumanRigBones.named(bone))!,
      index.size,
    );
    const lofted: AutoMovieHumanBindingLoft.IBinder = AutoMovieHumanBindingLoft.create(
      chains,
      scale,
      (p: [number, number, number]): Float64Array => AutoMovieHumanBindingInfluence.pull(p, tree, bones.length),
      bones.length,
    );
    return {
      skeleton,
      bind: (
        positions: readonly number[],
        bone?: AutoMovieHumanoidBone,
        coordinates?: readonly number[],
      ): IAutoMovieMeshSkin => {
        const count: number = positions.length / 3;
        const boneIndices: number[] = new Array<number>(4 * count).fill(0);
        const weights: number[] = new Array<number>(4 * count).fill(0);
        for (let v: number = 0; v < count; v++) {
          if (bone !== undefined) {
            boneIndices[4 * v] = index.get(bone)!;
            weights[4 * v] = 1;
            continue;
          }
          const top: [number, number][] =
            (coordinates === undefined
              ? null
              : lofted.at(coordinates[3 * v]!, coordinates[3 * v + 1]!, coordinates[3 * v + 2]!)) ??
            AutoMovieHumanBindingInfluence.influences(
              [positions[3 * v]!, positions[3 * v + 1]!, positions[3 * v + 2]!],
              tree,
              bones.length,
            );
          top.forEach(([b, w]: [number, number], i: number): void => {
            boneIndices[4 * v + i] = b;
            weights[4 * v + i] = w;
          });
        }
        return { joints: bones, boneIndices, weights };
      },
    };
  }

  /**
   * Give every part a skin. A part whose vertices carry loft coordinates (the
   * skin's pieces, the construction curves drawn on its chains) takes its
   * chains' binding at those parameters, so a curve stays on the skin it
   * draws under any pose; rigid features ride one bone; any other vertex is
   * read at its place.
   *
   * @param parts The model's parts, in metres.
   * @param rig The body's rig.
   * @param coordinates Loft coordinates of the parts that carry them, by part id, three per vertex.
   * @returns The parts bound to the rig.
   */
  export function dress(
    parts: readonly IAutoMovieModelPart[],
    rig: IRig,
    coordinates: ReadonlyMap<string, readonly number[]> = new Map(),
  ): IAutoMovieModelPart[] {
    return parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (part.geometry.type !== "mesh") return part;
      const mesh: typeof part.geometry.mesh = part.geometry.mesh;
      return {
        ...part,
        geometry: {
          ...part.geometry,
          mesh: {
            ...mesh,
            skin: {
              ...rig.bind(mesh.positions, AutoMovieHumanRigBones.rigid(part.id), coordinates.get(part.id)),
              method: BLEND,
            },
          },
        },
      };
    });
  }

  /**
   * An evaluated Human pose as each rig bone's transform in its parent's frame.
   *
   * @param rest The rig.
   * @param pose The evaluator's output for the same body.
   * @returns Per bone, the local transform to apply.
   */
  export function locals(
    rest: IAutoMovieSkeleton,
    pose: AutoMovieHumanSkeleton.IOutput,
  ): Map<AutoMovieHumanoidBone, ILocal> {
    return AutoMovieHumanRigPose.locals(rest, pose);
  }

  /**
   * The rig at its bind, the posture the skin was generated in, as local
   * transforms. This is not neutral, which is a pose of the bind.
   *
   * @param rest The rig.
   * @returns Per bone, the local transform that leaves the skin as generated.
   */
  export function bindLocals(
    rest: IAutoMovieSkeleton,
  ): Map<AutoMovieHumanoidBone, ILocal> {
    return AutoMovieHumanRigPose.bindLocals(rest);
  }

  /**
   * An evaluated Human pose as the engine's clinical pose of this rig.
   *
   * @param rest The rig.
   * @param pose The evaluator's output for the same body.
   * @returns The engine pose, and the bones whose translation it cannot carry.
   */
  export function enginePose(
    rest: IAutoMovieSkeleton,
    pose: AutoMovieHumanSkeleton.IOutput,
  ): IEnginePose {
    return AutoMovieHumanRigPose.enginePose(rest, pose);
  }
}

/** A tuple as an interface vector. */
function vector(v: readonly number[]): { x: number; y: number; z: number } {
  return { x: v[0]!, y: v[1]!, z: v[2]! };
}

/**
 * How the skin blends its bones. A linear blend thinned the bent thigh and the
 * elbow's inside on the same pose; this keeps their volume, at the price of a
 * slight corner outside a deep bend.
 */
const BLEND = "dual-quaternion" as const;
