import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { AutoMovieHumanRigBones } from "./AutoMovieHumanRigBones";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * An evaluated Human pose as the rig's transforms: each bone's local transform
 * in its parent's frame, the bind's, and the engine's clinical pose of this
 * rig.
 */
export namespace AutoMovieHumanRigPose {
  /** One bone's transform in its parent's frame, metres. */
  export interface ILocal {
    /** Offset from the parent. */
    translation: [number, number, number];

    /** Rotation from the parent, `[x, y, z, w]`. */
    rotation: [number, number, number, number];
  }

  /** An engine pose with what it could not carry. */
  export interface IEnginePose {
    /** The clinical pose. */
    pose: IAutoMoviePose;

    /** Bones that moved along their parent, which the engine's rig cannot do. */
    translated: AutoMovieHumanoidBone[];
  }

  /** Shift along a parent below which a bone has not moved, metres. */
  export const TRANSLATED: number = 1e-6;

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
    const placed: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
      pose.posed.map(
        (p: AutoMovieHumanSkeleton.IPlacement): [
          string,
          AutoMovieHumanSkeleton.IPlacement,
        ] => [p.bone, p],
      ),
    );
    const out: Map<AutoMovieHumanoidBone, ILocal> = new Map();
    for (const bone of rest.bones) {
      // A pose evaluated for another body or skeleton lacks a rig bone's
      // joint; refusing it here keeps a foreign pose from placing any bone.
      const own: AutoMovieHumanSkeleton.IPlacement | undefined = placed.get(
        AutoMovieHumanRigBones.joint(bone.bone),
      );
      const parent: AutoMovieHumanSkeleton.IPlacement | undefined =
        bone.parent === null
          ? undefined
          : placed.get(AutoMovieHumanRigBones.joint(bone.parent));
      if (own === undefined || (bone.parent !== null && parent === undefined))
        throw new Error(
          `Evaluated Human pose lacks the joint of rig bone ${bone.bone}`,
        );
      if (parent === undefined) {
        out.set(bone.bone, { translation: own.position, rotation: own.rotation });
        continue;
      }
      const inverse: Math3D.Quaternion = [
        -parent.rotation[0],
        -parent.rotation[1],
        -parent.rotation[2],
        parent.rotation[3],
      ];
      out.set(bone.bone, {
        translation: Math3D.rotate(
          inverse,
          Math3D.sub(own.position, parent.position),
        ),
        rotation: Math3D.multiply(inverse, own.rotation),
      });
    }
    return out;
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
    return new Map(
      rest.bones.map((bone: IAutoMovieBone): [AutoMovieHumanoidBone, ILocal] => {
        const t: IAutoMovieBone["rest"]["translation"] = bone.rest.translation;
        return [
          bone.bone,
          { translation: [t.x, t.y, t.z], rotation: [0, 0, 0, 1] },
        ];
      }),
    );
  }

  /**
   * An evaluated Human pose as the engine's clinical pose of this rig.
   *
   * The rig's rest is the bind, its rotations are identity and its bones
   * declare the Human's own axes and composition, so each local rotation from
   * the bind splits exactly into the three angles the engine composes back.
   * These are the rig's angles from the bind: neutral is itself a turn of
   * them, so they read the clinical field only where a bone's achieved offset
   * is zero. Only translation has no channel: a jaw's protrusion and a
   * shoulder girdle's slide are lost, and the bones they move are listed so a
   * caller can refuse them.
   *
   * @param rest The rig.
   * @param pose The evaluator's output for the same body.
   * @returns The engine pose, and the bones whose translation it cannot carry.
   */
  export function enginePose(
    rest: IAutoMovieSkeleton,
    pose: AutoMovieHumanSkeleton.IOutput,
  ): IEnginePose {
    const local: Map<AutoMovieHumanoidBone, ILocal> = locals(rest, pose);
    const joints: IAutoMovieJointPose[] = [];
    const translated: AutoMovieHumanoidBone[] = [];
    let root: Math3D.Vector = [0, 0, 0];
    for (const bone of rest.bones) {
      const own: ILocal = local.get(bone.bone)!;
      const t: IAutoMovieBone["rest"]["translation"] = bone.rest.translation;
      const shift: Math3D.Vector = [
        own.translation[0] - t.x,
        own.translation[1] - t.y,
        own.translation[2] - t.z,
      ];
      if (bone.parent === null) root = shift;
      else if (Math.hypot(...shift) > TRANSLATED) translated.push(bone.bone);
      joints.push({ bone: bone.bone, ...angles(own.rotation, bone.axes!) });
    }
    return {
      pose: {
        skeleton: rest.id,
        root: {
          translation: { x: root[0], y: root[1], z: root[2] },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        joints,
      },
      translated,
    };
  }

  /** A local rotation as the three clinical angles of its axes, degrees. */
  function angles(
    q: readonly [number, number, number, number],
    axes: IAutoMovieJointAxes,
  ): Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist"> {
    const tuple: (v: { x: number; y: number; z: number }) => Math3D.Vector = (v: {
      x: number;
      y: number;
      z: number;
    }): Math3D.Vector => [
      v.x,
      v.y,
      v.z,
    ];
    const distal: boolean = axes.twistPlacement === "distal";
    const f: Math3D.Vector = tuple(axes.flexion);
    const a: Math3D.Vector = tuple(axes.abduction);
    const t: Math3D.Vector = tuple(axes.twist);

    // The composition is first * second * third about these axes. A
    // left-handed triple turns its last axis over, and that angle's sign with it.
    const first: Math3D.Vector = distal ? a : t;
    const second: Math3D.Vector = distal ? f : a;
    const third: Math3D.Vector = distal ? t : f;
    const crossed: Math3D.Vector = cross(first, second);
    const hand: number = dot(crossed, third) < 0 ? -1 : 1;
    const k: Math3D.Vector = Math3D.times(third, hand);
    const m: (u: Math3D.Vector, v: Math3D.Vector) => number = (
      u: Math3D.Vector,
      v: Math3D.Vector,
    ): number =>
      dot(u, Math3D.rotate([q[0], q[1], q[2], q[3]], v));
    const beta: number = Math.asin(Math.max(-1, Math.min(1, m(first, k))));
    const alpha: number = Math.atan2(-m(second, k), m(k, k));
    const gamma: number = Math.atan2(-m(first, second), m(first, first));
    const degrees: (r: number) => number = (r: number): number =>
      (r * 180) / Math.PI;
    const out: [number, number, number] = [
      degrees(alpha),
      degrees(beta),
      hand * degrees(gamma),
    ];
    return distal
      ? { abduction: out[0], flexion: out[1], twist: out[2] }
      : { twist: out[0], abduction: out[1], flexion: out[2] };
  }

  function cross(a: Math3D.Vector, b: Math3D.Vector): Math3D.Vector {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function dot(a: Math3D.Vector, b: Math3D.Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
