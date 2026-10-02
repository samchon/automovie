import { Quaternion } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The per-vertex rigid transform of the body's dual quaternion skinning, so a
 * displacement solved in the posed frame can be carried back to the rest
 * frame that a corrective row lives in.
 *
 * A corrective row is a rest-space displacement applied before skinning
 * (`IAutoMovieHumanBodyBasisCorrective`). Dual quaternion blending makes each
 * vertex's posed position `R p + t` with `R` the rotation matrix of its
 * normalised blended quaternion, so a rest displacement `d` moves the posed
 * vertex by `R d`, and a posed displacement `d'` needs the rest row `Rᵀ d'`.
 * The carry is exact for vertices skinned by `skinHumanBodySurface` without a
 * spread twist (`distributeTwist` splits a bone's twist along its axis and is
 * not modelled here, which is right for a flexion or abduction of the hip and
 * the knee and must be re-verified through the public builder for a twist).
 *
 * This mirrors `skinHumanBodySurface` (signs aligned parent to child once per
 * pose, weights blended, real part normalised) because the package exposes the
 * skinned positions and not the per-vertex blend. The unit test compares the
 * mirror with the package's skinning on a fixture, so a change to the
 * package's blend that this file does not follow fails there.
 */

/** Rest and posed world frames of each bone, as the builder returns them. */
export type BodyBoneFrames = Map<
  AutoMovieHumanoidBone,
  {
    rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
    posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
  }
>;

/** The rotation matrix of a unit quaternion, row-major. */
export function rotationMatrixOf(q: IAutoMovieQuaternion): number[][] {
  const { x, y, z, w } = q;
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

/**
 * Per bone, the unit dual quaternion of `posed ∘ rest⁻¹` with its sign aligned
 * to its parent's, in the order of the skin's own joint list.
 */
function boneDualQuaternions(
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  frames: BodyBoneFrames,
  joints: readonly {
    bone: AutoMovieHumanoidBone;
    parent: AutoMovieHumanoidBone | null;
  }[],
): { real: IAutoMovieQuaternion; dual: IAutoMovieQuaternion }[] {
  const aligned = new Map<
    AutoMovieHumanoidBone,
    { real: IAutoMovieQuaternion; dual: IAutoMovieQuaternion }
  >();
  for (const joint of joints) {
    const frame = frames.get(joint.bone);
    if (frame === undefined) throw new Error("no frame for " + joint.bone);
    const q = Quaternion.multiply(
      frame.posed.rotation,
      Quaternion.inverse(frame.rest.rotation),
    );
    const m = rotationMatrixOf(q);
    const rp = frame.rest.position;
    const pp = frame.posed.position;
    const t = [
      pp.x - (m[0][0] * rp.x + m[0][1] * rp.y + m[0][2] * rp.z),
      pp.y - (m[1][0] * rp.x + m[1][1] * rp.y + m[1][2] * rp.z),
      pp.z - (m[2][0] * rp.x + m[2][1] * rp.y + m[2][2] * rp.z),
    ];
    const dual = {
      x: 0.5 * (t[0] * q.w + t[1] * q.z - t[2] * q.y),
      y: 0.5 * (-t[0] * q.z + t[1] * q.w + t[2] * q.x),
      z: 0.5 * (t[0] * q.y - t[1] * q.x + t[2] * q.w),
      w: 0.5 * (-t[0] * q.x - t[1] * q.y - t[2] * q.z),
    };
    const parent =
      joint.parent === null ? undefined : aligned.get(joint.parent);
    const sign =
      parent !== undefined &&
      parent.real.x * q.x +
        parent.real.y * q.y +
        parent.real.z * q.z +
        parent.real.w * q.w <
        0
        ? -1
        : 1;
    aligned.set(joint.bone, {
      real: { x: sign * q.x, y: sign * q.y, z: sign * q.z, w: sign * q.w },
      dual: {
        x: sign * dual.x,
        y: sign * dual.y,
        z: sign * dual.z,
        w: sign * dual.w,
      },
    });
  }
  return skin.joints.map((bone) => aligned.get(bone)!);
}

/** The blended rigid transform of one vertex: `posed = rotation p + translation`. */
export interface IBodyVertexBlend {
  rotation: number[][];
  translation: number[];
}

/**
 * The blended rigid transform of every vertex. The four weights of a vertex
 * blend the bones' dual quaternions, the sum is divided by the norm of its
 * real part (`1` when the real part cancels to zero), and the translation is
 * `2 · dual · conjugate(real)`. Requires every bone the skin names to have a
 * frame; a missing bone throws.
 */
export function blendBodyVertices(
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  frames: BodyBoneFrames,
  vertices: number,
  joints: readonly {
    bone: AutoMovieHumanoidBone;
    parent: AutoMovieHumanoidBone | null;
  }[],
): IBodyVertexBlend[] {
  const bones = boneDualQuaternions(skin, frames, joints);
  const out: IBodyVertexBlend[] = [];
  for (let v = 0; v < vertices; v++) {
    const real = { x: 0, y: 0, z: 0, w: 0 };
    const dual = { x: 0, y: 0, z: 0, w: 0 };
    for (let k = 0; k < 4; k++) {
      const weight = skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const bone = bones[skin.boneIndices[v * 4 + k]];
      for (const key of ["x", "y", "z", "w"] as const) {
        real[key] += weight * bone.real[key];
        dual[key] += weight * bone.dual[key];
      }
    }
    const size = Math.hypot(real.x, real.y, real.z, real.w) || 1;
    for (const key of ["x", "y", "z", "w"] as const) {
      real[key] /= size;
      dual[key] /= size;
    }
    out.push({
      rotation: rotationMatrixOf(real),
      translation: [
        2 *
          (-dual.w * real.x +
            dual.x * real.w -
            dual.y * real.z +
            dual.z * real.y),
        2 *
          (-dual.w * real.y +
            dual.x * real.z +
            dual.y * real.w -
            dual.z * real.x),
        2 *
          (-dual.w * real.z -
            dual.x * real.y +
            dual.y * real.x +
            dual.z * real.w),
      ],
    });
  }
  return out;
}

/** Carry a posed displacement to the rest frame: `Rᵀ d`. */
export function carryToRest(rotation: number[][], d: number[]): number[] {
  return [0, 1, 2].map(
    (r) =>
      rotation[0][r] * d[0] + rotation[1][r] * d[1] + rotation[2][r] * d[2],
  );
}

/** Carry a rest displacement to the posed frame: `R d`. */
export function carryToPosed(rotation: number[][], d: number[]): number[] {
  return [0, 1, 2].map(
    (r) =>
      rotation[r][0] * d[0] + rotation[r][1] * d[1] + rotation[r][2] * d[2],
  );
}
