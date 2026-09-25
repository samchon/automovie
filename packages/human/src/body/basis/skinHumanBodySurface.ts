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
 * A joint that spreads its twist (`distributeTwist`) is a rig's twist joint
 * made continuous: its rotation relative to its parent is split into a swing
 * and a twist about its rest axis, from its head to its one child's head,
 * and each vertex it moves takes the swing whole and the twist in proportion
 * to where it lies along that axis (none at the head, all of it at the
 * child's head, held at the ends), on the twist's shortest arc. An upper arm
 * turned about its own axis then shears its skin from the shoulder to the
 * elbow instead of wrenching the armpit round at the joint. A unit-weight
 * vertex of such a bone is rigid in the swing only.
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
    "bone" | "parent" | "distributeTwist"
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
  // A bone that spreads its twist: its rotation relative to its parent,
  // split into a swing and a twist about its rest axis (head to its one
  // child's head), each vertex taking the twist in proportion to where it
  // lies along that axis.
  const spread = skin.joints.map((bone) => {
    const joint = joints.find((one) => one.bone === bone);
    if (joint?.distributeTwist !== true) return null;
    const child = joints.find((one) => one.parent === bone)!;
    const own = transforms.get(bone)!;
    const head = own.rest.position;
    const along = Vector3.subtract(
      transforms.get(child.bone)!.rest.position,
      head,
    );
    const length = Vector3.length(along);
    const axis = Vector3.scale(along, 1 / length);
    const delta = (b: AutoMovieHumanoidBone): IAutoMovieQuaternion => {
      const t = transforms.get(b)!;
      return Quaternion.multiply(
        t.posed.rotation,
        Quaternion.inverse(t.rest.rotation),
      );
    };
    const parentDelta =
      joint.parent === null ? Quaternion.identity() : delta(joint.parent);
    const local = Quaternion.multiply(
      Quaternion.inverse(parentDelta),
      delta(bone),
    );
    const projected = local.x * axis.x + local.y * axis.y + local.z * axis.z;
    const twistSize = Math.hypot(local.w, projected);
    const twist =
      twistSize < 1e-12
        ? Quaternion.identity()
        : {
            x: (projected * axis.x) / twistSize,
            y: (projected * axis.y) / twistSize,
            z: (projected * axis.z) / twistSize,
            w: local.w / twistSize,
          };
    return {
      head,
      posedHead: own.posed.position,
      axis,
      length,
      base: Quaternion.multiply(
        parentDelta,
        Quaternion.multiply(local, Quaternion.inverse(twist)),
      ),
      twist,
      reference: aligned.get(bone)!.real,
    };
  });
  /** The dual quaternion a spread bone gives the vertex at `p`. */
  const spreadAt = (
    one: NonNullable<(typeof spread)[number]>,
    p: IAutoMovieVector3,
  ): { real: IAutoMovieQuaternion; dual: IAutoMovieQuaternion } => {
    const fraction = Math.min(
      1,
      Math.max(
        0,
        Vector3.dot(Vector3.subtract(p, one.head), one.axis) / one.length,
      ),
    );
    const real = Quaternion.multiply(one.base, power(one.twist, fraction));
    const translation = Vector3.subtract(
      one.posedHead,
      Quaternion.rotateVector(real, one.head),
    );
    const dual = scale(
      Quaternion.multiply({ ...translation, w: 0 }, real),
      0.5,
    );
    // the same hemisphere as the bone's own, which its parent chose
    const sign = dot(one.reference, real) < 0 ? -1 : 1;
    return { real: scale(real, sign), dual: scale(dual, sign) };
  };
  const output = new Array<number>(positions.length);
  for (let v = 0; v < positions.length / 3; v++) {
    const real = { x: 0, y: 0, z: 0, w: 0 };
    const dual = { x: 0, y: 0, z: 0, w: 0 };
    for (let k = 0; k < 4; k++) {
      const weight = skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const index = skin.boneIndices[v * 4 + k];
      const spreading = spread[index];
      const bone =
        spreading === null
          ? bones[index]
          : spreadAt(
              spreading,
              Vector3.create(
                positions[v * 3],
                positions[v * 3 + 1],
                positions[v * 3 + 2],
              ),
            );
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

/** A unit quaternion raised to `t` along its shortest arc. */
const power = (q: IAutoMovieQuaternion, t: number): IAutoMovieQuaternion => {
  const sign = q.w < 0 ? -1 : 1;
  const angle = Math.acos(Math.min(1, sign * q.w));
  const sine = Math.sin(angle);
  if (sine < 1e-12) return { x: 0, y: 0, z: 0, w: 1 };
  const k = (sign * Math.sin(t * angle)) / sine;
  return { x: q.x * k, y: q.y * k, z: q.z * k, w: Math.cos(t * angle) };
};

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
