import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Dual quaternion skinning of one shaped surface from rest to posed bone
 * frames (Kavan, Collins, Zara and O'Sullivan, "Skinning with dual
 * quaternions", 2007), the pose step of `createHumanBodyBasisBuilder`.
 *
 * Each bone's change of frame `posed ∘ rest⁻¹` is one rigid transform, and a
 * rigid transform is one unit dual quaternion `q̂ = q + ε d`: the real part
 * `q = posed.rotation ⊗ rest.rotation⁻¹` is the rotation and the dual part
 * `d = ½ (t ⊗ q)` carries the translation `t = posed.position − q(rest.position)`
 * as a pure quaternion. q̂ and −q̂ name the same transform, and which of the
 * two a bone contributes decides which way round the blend travels, so the
 * sign is chosen once per bone for the whole skin: walking the skeleton
 * parent before child, each bone's q̂ is flipped into its parent's
 * hemisphere. A vertex p with influences (bone_i, w_i) then blends
 * `Σ w_i q̂_i` with those signs, divides both parts by the real part's norm,
 * and applies the result as a rigid transform: `p' = q(p) + 2 (d ⊗ q*)`, the
 * product read as a vector. Positions are metres in the basis frame and
 * rotations are world frames from the pose resolver.
 *
 * Choosing the sign per vertex against its first influence, as an earlier
 * revision did, is order-dependent and tears the skin when a bone turns near
 * a half turn from its rest: the arm raised forward overhead is 180 degrees
 * from the A-pose, nearly orthogonal in quaternion space to the girdle and
 * the upper chest it blends with, so a vertex whose first influence was the
 * arm could flip the girdle and the chest to opposite signs, and two almost
 * equal rotations cancelled, while its neighbour with the chest first did
 * not. With parent-aligned signs every vertex travels the arc the skeleton
 * travelled, the blend is invariant to the order influences are listed in,
 * and it cannot cancel while each joint turns less than a half turn from its
 * parent: parent and child real parts then have a nonnegative dot, so the
 * sum of positively weighted aligned parts stays away from zero.
 *
 * The linear blend this replaces averaged the influences' rigid images, which
 * is a mean of rotation matrices: as two influences approach 180 degrees
 * apart the mean loses rank and the skin between them flattens onto the pivot
 * (the shipped basis's upper arm at flexion 180 collapsed to a thin plate),
 * and under a twist the mean's radius shrinks by the cosine of half the
 * angle, the candy-wrapper pinch. The dual quaternion blend is itself a rigid
 * transform, a screw motion between the influences, so a blended vertex keeps
 * its distance from the shared axis at every angle, a 50/50 vertex between a
 * still bone and one turned by θ turns by θ/2 about the same pivot, and the
 * per-vertex blend a corrective solver inverts to carry a posed displacement
 * back to rest is a rotation, always well conditioned. A vertex bound to one
 * bone with weight one is exactly rigid, the property the rigid-segment check
 * measures. The known limit is the bulge Kavan reports at a fold: the arc a
 * blended vertex walks lies outside the linear chord, so the inside of a
 * deep bend gains a little volume, which a pose corrective may take back.
 * Normals are not transported here: the builder recomputes them on the posed
 * surface so a seam between differently weighted vertices cannot show a
 * lighting discontinuity the geometry does not have.
 *
 * Every bone the skin names must have a rest and a posed transform; the basis
 * admission guarantees the skin only names declared joints and the pose
 * resolver visits every declared joint, so a missing entry here is a
 * programming error rather than a data error, and it throws. Any corrective
 * row solved as `rigid − linear` on the former blend is a derivative of this
 * formula and is stale under it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Moves each vertex by a rigid screw motion blended from its bones' frame changes, so a half-open joint places skin on the arc at every angle, including the fold where a linear mean would flatten it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Implements the specification's rigid transform per vertex: each bone's `posed ∘ rest⁻¹` as a unit dual quaternion, combined by the skin weights, normalized and applied, with unit-weight vertices exactly rigid.
 */
export function skinHumanBodySurface(
  positions: number[],
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  /** Every bone parent before child, as the basis declares its joints. */
  joints: readonly Pick<
    IAutoMovieHumanBodyBasis["joints"][number],
    "bone" | "parent"
  >[],
  transforms: Map<
    AutoMovieHumanoidBone,
    {
      rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
      posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
    }
  >,
): number[] {
  const aligned = new Map<
    AutoMovieHumanoidBone,
    { real: IAutoMovieQuaternion; dual: IAutoMovieQuaternion }
  >();
  for (const joint of joints) {
    const transform = transforms.get(joint.bone);
    if (transform === undefined)
      throw new Error(
        "Body skin names a joint without transforms: " + joint.bone,
      );
    const real = Quaternion.multiply(
      transform.posed.rotation,
      Quaternion.inverse(transform.rest.rotation),
    );
    const translation = Vector3.subtract(
      transform.posed.position,
      Quaternion.rotateVector(real, transform.rest.position),
    );
    const dual = scale(
      Quaternion.multiply({ ...translation, w: 0 }, real),
      0.5,
    );
    const parent =
      joint.parent === null ? undefined : aligned.get(joint.parent);
    const sign = parent !== undefined && dot(parent.real, real) < 0 ? -1 : 1;
    aligned.set(joint.bone, {
      real: scale(real, sign),
      dual: scale(dual, sign),
    });
  }
  const bones = skin.joints.map((bone) => {
    const found = aligned.get(bone);
    if (found === undefined)
      throw new Error("Body skin names a joint without transforms: " + bone);
    return found;
  });
  const output = new Array<number>(positions.length);
  for (let v = 0; v < positions.length / 3; v++) {
    const real = { x: 0, y: 0, z: 0, w: 0 };
    const dual = { x: 0, y: 0, z: 0, w: 0 };
    for (let k = 0; k < 4; k++) {
      const weight = skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const bone = bones[skin.boneIndices[v * 4 + k]];
      accumulate(real, bone.real, weight);
      accumulate(dual, bone.dual, weight);
    }
    const size = Math.hypot(real.x, real.y, real.z, real.w);
    const rotation = scale(real, 1 / size);
    const translation = scale(
      Quaternion.multiply(scale(dual, 1 / size), Quaternion.inverse(rotation)),
      2,
    );
    const moved = Vector3.add(
      Quaternion.rotateVector(
        rotation,
        Vector3.create(
          positions[v * 3],
          positions[v * 3 + 1],
          positions[v * 3 + 2],
        ),
      ),
      translation,
    );
    output[v * 3] = moved.x;
    output[v * 3 + 1] = moved.y;
    output[v * 3 + 2] = moved.z;
  }
  return output;
}

const dot = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
  a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

const scale = (q: IAutoMovieQuaternion, s: number): IAutoMovieQuaternion => ({
  x: q.x * s,
  y: q.y * s,
  z: q.z * s,
  w: q.w * s,
});

const accumulate = (
  sum: IAutoMovieQuaternion,
  q: IAutoMovieQuaternion,
  s: number,
): void => {
  sum.x += q.x * s;
  sum.y += q.y * s;
  sum.z += q.z * s;
  sum.w += q.w * s;
};
