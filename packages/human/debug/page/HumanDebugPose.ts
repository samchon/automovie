import type {
  AutoMovieHumanoidBone,
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../../../engine/src/kinematics/IAutoMovieResolvedBone";
import { Quaternion } from "../../../engine/src/math/Quaternion";
import { skinAutoMovieMesh } from "../../../engine/src/skinning/skinAutoMovieMesh";
import { AutoMovieHumanInstance } from "../../src/instance/AutoMovieHumanInstance";
import type { IAutoMovieHumanPrepared } from "../../src/instance/IAutoMovieHumanPrepared";
import type { AutoMovieHumanRig } from "../../src/skeleton/AutoMovieHumanRig";
import type { AutoMovieHumanSkeleton } from "../../src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../src/structures/pose/IAutoMovieHumanPose";
import { HUMAN_DEBUG_POSES } from "../poses/HUMAN_DEBUG_POSES";

/**
 * The whole figure moved into a named pose by the production rig, as the posed skin a renderer
 * draws.
 *
 * The pose is `HUMAN_DEBUG_POSES[name]` admitted by an `AutoMovieHumanInstance` over the prepared
 * body (`AutoMovieHuman.prepare`): its `locals()` are each rig bone's transform in its parent's
 * frame under the pose, and `bindLocals()` the same at the bind the skin was generated in. Both are
 * composed parent first into world bones, so a pose that translates a bone along its parent (a
 * folded scapula or atlas) moves it too, which the engine pose adapter cannot carry. Every part
 * with a skin binding is then moved by the engine's `skinAutoMovieMesh`, the formula the viewer's
 * shader draws, with the binding's own method; a part attached rigidly to a bone moves with that
 * bone alone. Normals turn with the same blended rigid transform: the difference of the skinned
 * point and the skinned point one millimetre along its normal. The result carries no skin, so the
 * page draws the posed positions as plain meshes and its shading, sections and framing read them.
 *
 * `bind` names the unposed skin as generated.
 */
export namespace HumanDebugPose {
  /** The pose name that leaves the skin at its bind. */
  export const BIND: string = "bind";

  /** What posing one model reports. */
  export interface IResult {
    /** The parts, posed; the input parts are unchanged. */
    parts: IAutoMovieModelPart[];

    /** Pose fields the evaluator clamped to their range, as `<path>: <requested> -> <applied>`. */
    clamped: string[];

    /** Parts moved by their skin or bone. */
    moved: number;

    /** Parts that stayed where they were: no binding, or a part transform the skinning frame does not cover. */
    kept: string[];

    /** Milliseconds the evaluation and the skinning took. */
    milliseconds: { evaluate: number; skin: number };
  }

  /**
   * Every pose name the viewer accepts: the bind and each shared pose.
   *
   * @returns The names.
   */
  export function names(): string[] {
    return [BIND, ...Object.keys(HUMAN_DEBUG_POSES)];
  }

  /**
   * Pose a prepared body's parts.
   *
   * @param prepared The prepared body: its model, rig and evaluator.
   * @param parts The parts to move, in model metres.
   * @param name A key of `HUMAN_DEBUG_POSES`.
   * @returns The posed parts and what the pose did.
   */
  export function apply(
    prepared: IAutoMovieHumanPrepared,
    parts: readonly IAutoMovieModelPart[],
    name: string,
  ): IResult {
    const pose: IAutoMovieHumanPose | undefined = HUMAN_DEBUG_POSES[name];
    if (pose === undefined)
      throw new Error("Unknown Human pose " + name + "; known: " + names().join(", "));
    const started: number = performance.now();
    const instance: AutoMovieHumanInstance = new AutoMovieHumanInstance(
      { evaluate: prepared.evaluate, skeleton: prepared.skeleton },
      { pose },
    );
    const skeleton: IAutoMovieSkeleton = prepared.skeleton;
    const rest: IAutoMovieResolvedBone[] = world(skeleton, instance.bindLocals());
    const posed: IAutoMovieResolvedBone[] = world(skeleton, instance.locals());
    const clamped: string[] = instance.clamped.map(
      (c: AutoMovieHumanSkeleton.IClamp): string => c.path + ": " + c.requested + " -> " + c.applied,
    );
    const evaluated: number = performance.now();

    let moved: number = 0;
    const kept: string[] = [];
    const out: IAutoMovieModelPart[] = parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (part.geometry.type !== "mesh") return part;
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      const bound: IAutoMovieMesh | null =
        mesh.skin !== null ? mesh : part.attachedBone !== null ? rigid(mesh, part.attachedBone) : null;
      if (bound === null || part.transform !== null) {
        kept.push(part.id);
        return part;
      }
      moved += 1;
      const positions: number[] = skinAutoMovieMesh(bound, rest, posed);
      return {
        ...part,
        attachedBone: null,
        geometry: {
          type: "mesh",
          mesh: { ...mesh, positions, normals: turned(bound, rest, posed, positions), skin: null },
        },
      };
    });
    return {
      parts: out,
      clamped,
      moved,
      kept,
      milliseconds: {
        evaluate: Math.round(evaluated - started),
        skin: Math.round(performance.now() - evaluated),
      },
    };
  }

  /**
   * Rig bones in world space from their local transforms, parents first.
   *
   * @param skeleton The rig.
   * @param locals Each bone's translation and rotation in its parent's frame.
   * @returns One resolved bone per rig bone.
   */
  function world(
    skeleton: IAutoMovieSkeleton,
    locals: ReadonlyMap<AutoMovieHumanoidBone, AutoMovieHumanRig.ILocal>,
  ): IAutoMovieResolvedBone[] {
    const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    const visit = (bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone => {
      const done: IAutoMovieResolvedBone | undefined = placed.get(bone);
      if (done !== undefined) return done;
      const own: AutoMovieHumanRig.ILocal | undefined = locals.get(bone);
      if (own === undefined) throw new Error("The pose gives no transform for rig bone " + bone);
      const parentName: AutoMovieHumanoidBone | null =
        skeleton.bones.find((b: { bone: AutoMovieHumanoidBone }): boolean => b.bone === bone)?.parent ?? null;
      const rotation: IAutoMovieQuaternion = {
        x: own.rotation[0],
        y: own.rotation[1],
        z: own.rotation[2],
        w: own.rotation[3],
      };
      const translation: IAutoMovieVector3 = { x: own.translation[0], y: own.translation[1], z: own.translation[2] };
      let result: IAutoMovieResolvedBone;
      if (parentName === null)
        result = { bone, localRotation: rotation, worldPosition: translation, worldRotation: rotation };
      else {
        const parent: IAutoMovieResolvedBone = visit(parentName);
        const offset: IAutoMovieVector3 = Quaternion.rotateVector(parent.worldRotation, translation);
        result = {
          bone,
          localRotation: rotation,
          worldPosition: {
            x: parent.worldPosition.x + offset.x,
            y: parent.worldPosition.y + offset.y,
            z: parent.worldPosition.z + offset.z,
          },
          worldRotation: Quaternion.multiply(parent.worldRotation, rotation),
        };
      }
      placed.set(bone, result);
      return result;
    };
    return skeleton.bones.map((b: { bone: AutoMovieHumanoidBone }): IAutoMovieResolvedBone => visit(b.bone));
  }

  /**
   * A rigid part as a mesh bound wholly to its bone.
   *
   * @param mesh The part's mesh.
   * @param bone The bone it rides.
   * @returns The mesh with a one-joint skin.
   */
  function rigid(mesh: IAutoMovieMesh, bone: AutoMovieHumanoidBone): IAutoMovieMesh {
    const count: number = mesh.positions.length / 3;
    const weights: number[] = new Array<number>(count * 4).fill(0);
    for (let v: number = 0; v < count; ++v) weights[v * 4] = 1;
    return { ...mesh, skin: { joints: [bone], boneIndices: new Array<number>(count * 4).fill(0), weights } };
  }

  /**
   * Normals turned by each vertex's blended rigid transform.
   *
   * @param mesh The bound mesh.
   * @param rest Bones at the bind.
   * @param posed Bones in the pose.
   * @param positions The skinned positions.
   * @returns Unit normals, or the mesh's own when it has none.
   */
  function turned(
    mesh: IAutoMovieMesh,
    rest: readonly IAutoMovieResolvedBone[],
    posed: readonly IAutoMovieResolvedBone[],
    positions: readonly number[],
  ): number[] | null {
    const normals: number[] | null = mesh.normals;
    if (normals === null || normals.length !== mesh.positions.length) return normals;
    const offset: number[] = mesh.positions.map((p: number, i: number): number => p + STEP * normals[i]!);
    const moved: number[] = skinAutoMovieMesh({ ...mesh, positions: offset, targets: undefined }, rest, posed);
    const out: number[] = new Array<number>(positions.length);
    for (let i: number = 0; i < positions.length; i += 3) {
      const x: number = moved[i]! - positions[i]!;
      const y: number = moved[i + 1]! - positions[i + 1]!;
      const z: number = moved[i + 2]! - positions[i + 2]!;
      const length: number = Math.hypot(x, y, z) || 1;
      out[i] = x / length;
      out[i + 1] = y / length;
      out[i + 2] = z / length;
    }
    return out;
  }

  /** Distance along a normal whose skinned image gives the turned normal, metres. */
  const STEP: number = 0.001;
}
