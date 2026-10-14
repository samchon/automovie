import {
  AutoMovieHumanoidBone,
  IAutoMovieMesh,
  IAutoMovieMeshSkin,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { Quaternion } from "../math/Quaternion";

/**
 * Skin a mesh's vertices from its rest pose into a resolved pose, by the
 * method its skin declares, with the formula the viewer's shader draws.
 *
 * Each joint `j` moves its vertices by the rigid transform `C_j = P_j R_j^-1`,
 * where `R_j` is its rest frame and `P_j` its posed frame. `"linear"` (also an
 * omitted method) returns `sum(w_k C_k v) / sum(w_k)`, the matrix blend that
 * `THREE.SkinnedMesh` computes after normalizing the weights. `"dual-quaternion"`
 * turns each `C_j` into a unit dual quaternion, negates any whose rotation lies
 * in the other hemisphere from the vertex's largest-weight joint (the lowest
 * slot on a tie), sums them by weight, divides by the length of the rotation
 * part and applies that rigid transform (Kavan et al. 2008).
 *
 * Positions are read in the frame the rest bones are expressed in: model space
 * for `resolvePose` output, so a part with a transform has it applied to the
 * positions first. Both methods commute with a rigid or uniformly scaled part
 * transform, which is why the viewer can skin in the part's own frame. The
 * result is in the posed bones' frame, so passing bones resolved with a pose
 * root places the vertices by that root as well.
 *
 * Throws when the mesh has no skin or a skin joint is missing from either bone
 * list.
 *
 * @param mesh Admitted mesh with a skin.
 * @param rest Bones at rest, such as `resolvePose` of a pose with no joints
 *   and a null root.
 * @param posed Bones in the pose to skin into, from `resolvePose`.
 * @returns Flat skinned positions `[x,y,z,...]` in metres, aligned with
 *   `mesh.positions`.
 *
 * @evidence contracts/common.md#principled-implementation Linear blend skinning and dual quaternion skinning (Kavan et al. 2008) over per-joint rigid transforms `P R^-1`; rigidity holds because resolvePose composes rotations and translations only, and dual quaternion blending premises influences within 180 degrees of the pivot, which is the documented flip limit. Positions are blended in double precision while the shader uses single precision, so the two agree to float rounding, not bit for bit.
 * @evidence contracts/common.md#clear-and-simple-design One function owns both blends so a measurement reads the formula the render uses; the joint transforms are computed once per joint and the method switch is per call, not per vertex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing skin or joint throws instead of leaving vertices at rest, and no joint, mesh or weight pattern is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States both formulas, the pivot rule, the input and output frames, the part-transform premise, the throw conditions and each parameter's source.
 * @evidence contracts/performance.md#efficient-algorithms O(J + V) for J skin joints and V vertices: one transform per joint, then four influences per vertex with constant temporary storage beyond the returned array.
 * @evidence contracts/performance.md#reuse-equivalent-work Joint transforms are shared by every vertex of the call; a different pose needs a new call, and nothing is cached across calls because bone lists carry no identity key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the per-joint tables are local and the returned array, 3V numbers, belongs to the caller.
 * @author Samchon
 */
export const skinAutoMovieMesh: (
  mesh: IAutoMovieMesh,
  rest: readonly IAutoMovieResolvedBone[],
  posed: readonly IAutoMovieResolvedBone[],
) => number[] = (
  mesh: IAutoMovieMesh,
  rest: readonly IAutoMovieResolvedBone[],
  posed: readonly IAutoMovieResolvedBone[],
): number[] => {
  const skin: IAutoMovieMeshSkin | null = mesh.skin;
  if (skin === null) throw new Error("skinAutoMovieMesh needs a mesh with a skin");
  const joints: IJointTransform[] = jointTransforms(skin.joints, rest, posed);
  const dual: boolean = skin.method === "dual-quaternion";
  const vertexCount: number = mesh.positions.length / 3;
  const output: number[] = new Array<number>(mesh.positions.length);
  for (let v: number = 0; v < vertexCount; ++v) {
    const point: IAutoMovieVector3 = {
      x: mesh.positions[v * 3]!,
      y: mesh.positions[v * 3 + 1]!,
      z: mesh.positions[v * 3 + 2]!,
    };
    const moved: IAutoMovieVector3 = dual
      ? blendDualQuaternion(skin, joints, v, point)
      : blendLinear(skin, joints, v, point);
    output[v * 3] = moved.x;
    output[v * 3 + 1] = moved.y;
    output[v * 3 + 2] = moved.z;
  }
  return output;
};

/** One joint's rigid skinning transform and its unit dual quaternion. */
interface IJointTransform {
  /** Rotation of `P R^-1`. */
  rotation: IAutoMovieQuaternion;

  /** Translation of `P R^-1`, metres. */
  translation: IAutoMovieVector3;

  /** Dual part `0.5 (t, 0) q` of the transform's dual quaternion. */
  dual: IAutoMovieQuaternion;
}

/** Map each skin joint to its rigid transform `P R^-1`, throwing for a joint absent from either bone list. */
const jointTransforms: (
  joints: readonly AutoMovieHumanoidBone[],
  rest: readonly IAutoMovieResolvedBone[],
  posed: readonly IAutoMovieResolvedBone[],
) => IJointTransform[] = (
  joints: readonly AutoMovieHumanoidBone[],
  rest: readonly IAutoMovieResolvedBone[],
  posed: readonly IAutoMovieResolvedBone[],
): IJointTransform[] => {
  const restByBone: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    new Map(
      rest.map(
        (
          b: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b],
      ),
    );
  const posedByBone: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    new Map(
      posed.map(
        (
          b: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b],
      ),
    );
  return joints.map((joint: AutoMovieHumanoidBone): IJointTransform => {
    const r: IAutoMovieResolvedBone | undefined = restByBone.get(joint);
    const p: IAutoMovieResolvedBone | undefined = posedByBone.get(joint);
    if (r === undefined || p === undefined)
      throw new Error(
        `skin joint "${joint}" is missing from the ${r === undefined ? "rest" : "posed"} bones`,
      );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      p.worldRotation,
      Quaternion.inverse(r.worldRotation),
    );
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      rotation,
      r.worldPosition,
    );
    const translation: IAutoMovieVector3 = {
      x: p.worldPosition.x - turned.x,
      y: p.worldPosition.y - turned.y,
      z: p.worldPosition.z - turned.z,
    };
    const product: IAutoMovieQuaternion = Quaternion.multiply(
      { x: translation.x, y: translation.y, z: translation.z, w: 0 },
      rotation,
    );
    return {
      rotation,
      translation,
      dual: {
        x: product.x / 2,
        y: product.y / 2,
        z: product.z / 2,
        w: product.w / 2,
      },
    };
  });
};

/** Weighted matrix blend divided by the weight sum, as `THREE.SkinnedMesh` draws after normalizing its weights. */
const blendLinear: (
  skin: IAutoMovieMeshSkin,
  joints: readonly IJointTransform[],
  vertex: number,
  point: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  skin: IAutoMovieMeshSkin,
  joints: readonly IJointTransform[],
  vertex: number,
  point: IAutoMovieVector3,
): IAutoMovieVector3 => {
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  let total: number = 0;
  for (let k: number = 0; k < 4; ++k) {
    const weight: number = skin.weights[vertex * 4 + k]!;
    if (weight === 0) continue;
    const joint: IJointTransform = joints[skin.boneIndices[vertex * 4 + k]!]!;
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      joint.rotation,
      point,
    );
    x += weight * (turned.x + joint.translation.x);
    y += weight * (turned.y + joint.translation.y);
    z += weight * (turned.z + joint.translation.z);
    total += weight;
  }
  return { x: x / total, y: y / total, z: z / total };
};

/** Hemisphere-aligned weighted dual quaternion sum, normalized by its rotation part and applied to one point. */
const blendDualQuaternion: (
  skin: IAutoMovieMeshSkin,
  joints: readonly IJointTransform[],
  vertex: number,
  point: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  skin: IAutoMovieMeshSkin,
  joints: readonly IJointTransform[],
  vertex: number,
  point: IAutoMovieVector3,
): IAutoMovieVector3 => {
  let pivot: number = 0;
  for (let k: number = 1; k < 4; ++k)
    if (skin.weights[vertex * 4 + k]! > skin.weights[vertex * 4 + pivot]!)
      pivot = k;
  const reference: IAutoMovieQuaternion =
    joints[skin.boneIndices[vertex * 4 + pivot]!]!.rotation;
  const real: [number, number, number, number] = [0, 0, 0, 0];
  const dual: [number, number, number, number] = [0, 0, 0, 0];
  for (let k: number = 0; k < 4; ++k) {
    const weight: number = skin.weights[vertex * 4 + k]!;
    if (weight === 0) continue;
    const joint: IJointTransform = joints[skin.boneIndices[vertex * 4 + k]!]!;
    const q: IAutoMovieQuaternion = joint.rotation;
    const d: IAutoMovieQuaternion = joint.dual;
    const aligned: number =
      q.x * reference.x +
        q.y * reference.y +
        q.z * reference.z +
        q.w * reference.w <
      0
        ? -weight
        : weight;
    real[0] += aligned * q.x;
    real[1] += aligned * q.y;
    real[2] += aligned * q.z;
    real[3] += aligned * q.w;
    dual[0] += aligned * d.x;
    dual[1] += aligned * d.y;
    dual[2] += aligned * d.z;
    dual[3] += aligned * d.w;
  }
  const length: number = Math.hypot(real[0], real[1], real[2], real[3]);
  const [rx, ry, rz, rw]: number[] = real.map((c: number): number => c / length);
  const [dx, dy, dz, dw]: number[] = dual.map((c: number): number => c / length);
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(
    { x: rx!, y: ry!, z: rz!, w: rw! },
    point,
  );
  // translation = 2 * vector(d * conjugate(r)) = 2 (rw d - dw r + r x d)
  return {
    x: turned.x + 2 * (rw! * dx! - dw! * rx! + (ry! * dz! - rz! * dy!)),
    y: turned.y + 2 * (rw! * dy! - dw! * ry! + (rz! * dx! - rx! * dz!)),
    z: turned.z + 2 * (rw! * dz! - dw! * rz! + (rx! * dy! - ry! * dx!)),
  };
};
