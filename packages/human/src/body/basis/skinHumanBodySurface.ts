import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyToeSplit } from "../structures/surface/IAutoMovieHumanBodyToeSplit";
import type { IHumanBodyDualQuaternion } from "./IHumanBodyDualQuaternion";
import type { IHumanBodyTwistSpread } from "./IHumanBodyTwistSpread";

/**
 * Skin one shaped surface through its admitted rest-to-posed bone frames.
 *
 * Dual-quaternion blending follows [Kavan et al., 2007](https://users.cs.utah.edu/~ladislav/kavan07skinning/kavan07skinning.pdf). A bone's real quaternion is `posed.rotation * inverse(rest.rotation)`, with translation `posed.position - rotation(rest.position)` and dual part half the pure-translation quaternion times that real part. Parent-first joint order chooses a sign against the parent's real quaternion once per bone. The four weighted influence slots accumulate both parts; division by the real norm precedes rotation and twice the dual-times-inverse-real translation. Input and output positions are in the same body metre frame and caller arrays remain unchanged.
 *
 * Parent-aligned signs avoid choosing a different hemisphere from each vertex's first influence, which can disagree near a half turn. They do not guarantee that a vertex's whole influence set shares a hemisphere across a longer joint chain. A zero/nonfinite real norm or unrepresentable reciprocal refuses before normalization rather than returning a partial output. Admitted finite, aligned four-slot skin arrays, nonnegative normalized weights, unit bone rotations and valid distributed-twist axes remain caller premises; this routine is not the complete basis validator.
 *
 * A normalized blend applies one rigid transform at each vertex rather than averaging rigidly transformed positions. For two equal-weight rotations about the same pivot it follows the half-angle arc and retains that vertex's radius; this does not establish pairwise distance or local volume between differently weighted vertices. Fold bulging remains a geometric limitation, and corrective rows derived from the former linear blend are stale. Normals are recomputed by the surface owner after posing rather than transported here.
 *
 * `distributeTwist` separates the parent-relative swing and twist about the rest head-to-child axis. Each vertex receives the complete swing and its clamped axial fraction of the shortest-arc twist: zero at the head and one at the child's head. The 1e-12 quaternion-component/sine policies resolve numerical degeneracy, not clinical capacity. Such a bone is position-dependent even for unit weight, so whole-segment rigidity does not follow.
 *
 * A declared toe split redistributes all of a listed vertex's toes-slot weight once among its phalanx shares when every ray transform exists. Each ray aligns with its side's toes bone. Missing ray transforms retain ordinary toes-bone skinning; required joint transforms still refuse when absent. This geometric operation establishes neither biological skin fit nor contact, volume, clinical or visual acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Parent-first signs align admitted rest-to-posed dual quaternions before four-slot blending; distributed twist uses a clamped axial fraction and available toe rays redistribute the complete toes weight once.
 * @evidence contracts/common.md#clear-and-simple-design Bone alignment and twist decompositions precede one vertex walk; raw quaternion arithmetic stays local while rigid-frame operations use the shared engine owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing joints and nonrepresentable real normalization refuse instead of emitting NaNs; finite admitted skin/axis premises remain explicit and per-vertex rigid transforms do not certify tissue volume or clinical motion.
 * @evidence contracts/common.md#meaningful-documentation The prose gives body metre frames, blend formula, parent-sign limitation, numerical twist policies, toe fallback and stale linear-corrective consequences.
 * @evidence contracts/performance.md#efficient-algorithms Alignment is linear in J joints, skin-joint searches for twist setup cost O(SJ), and V vertices use four slots plus their declared toe-share counts; no collision solve is hidden in skinning.
 * @evidence contracts/performance.md#reuse-equivalent-work Aligned transforms, per-bone twist decompositions and vertex-to-toe-row indexing are prepared once for this call rather than reconstructed for each influence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Alignment, decomposition and toe maps are invocation-local; only the owned V-sized output positions escape, without persistent caches, external handles or tasks.
 */
export function skinHumanBodySurface(
  positions: number[],
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  /** Every bone parent before child, as the basis declares its joints. */
  joints: readonly Pick<
    IAutoMovieHumanBodyBasis["joints"][number],
    "bone" | "parent" | "distributeTwist"
  >[],
  transforms: ReadonlyMap<string, IAutoMovieHumanBodyBoneTransform>,
  /** The surface's toe ray split; used only when the rays carry transforms. */
  toeSplit?: IAutoMovieHumanBodyToeSplit,
): number[] {
  const aligned: Map<string, IHumanBodyDualQuaternion> = new Map<string, IHumanBodyDualQuaternion>();
  for (const joint of joints) {
    const transform: IAutoMovieHumanBodyBoneTransform | undefined = transforms.get(joint.bone);
    if (transform === undefined)
      throw new Error(
        "Body skin names a joint without transforms: " + joint.bone,
      );
    const real: IAutoMovieQuaternion = Quaternion.multiply(
      transform.posed.rotation,
      Quaternion.inverse(transform.rest.rotation),
    );
    const translation: IAutoMovieVector3 = Vector3.subtract(
      transform.posed.position,
      Quaternion.rotateVector(real, transform.rest.position),
    );
    const dual: IAutoMovieQuaternion = scale(
      Quaternion.multiply({ ...translation, w: 0 }, real),
      0.5,
    );
    const parent: IHumanBodyDualQuaternion | undefined =
      joint.parent === null ? undefined : aligned.get(joint.parent);
    const sign: number = parent !== undefined && dot(parent.real, real) < 0 ? -1 : 1;
    aligned.set(joint.bone, {
      real: scale(real, sign),
      dual: scale(dual, sign),
    });
  }
  const bones: IHumanBodyDualQuaternion[] = skin.joints.map((bone: string): IHumanBodyDualQuaternion => {
    const found: IHumanBodyDualQuaternion | undefined = aligned.get(bone);
    if (found === undefined)
      throw new Error("Body skin names a joint without transforms: " + bone);
    return found;
  });
  // A bone that spreads its twist: its rotation relative to its parent,
  // split into a swing and a twist about its rest axis (head to its one
  // child's head), each vertex taking the twist in proportion to where it
  // lies along that axis.
  const spread: (IHumanBodyTwistSpread | null)[] = skin.joints.map((bone: string): IHumanBodyTwistSpread | null => {
    const joint: typeof joints[number] | undefined = joints.find((one: typeof joints[number]): boolean => one.bone === bone);
    if (joint?.distributeTwist !== true) return null;
    const child: typeof joints[number] = joints.find((one: typeof joints[number]): boolean => one.parent === bone)!;
    const own: IAutoMovieHumanBodyBoneTransform = transforms.get(bone)!;
    const head: IAutoMovieVector3 = own.rest.position;
    const along: IAutoMovieVector3 = Vector3.subtract(
      transforms.get(child.bone)!.rest.position,
      head,
    );
    const length: number = Vector3.length(along);
    const axis: IAutoMovieVector3 = Vector3.scale(along, 1 / length);
    const delta: (b: string) => IAutoMovieQuaternion = (b: string): IAutoMovieQuaternion => {
      const t: IAutoMovieHumanBodyBoneTransform = transforms.get(b)!;
      return Quaternion.multiply(
        t.posed.rotation,
        Quaternion.inverse(t.rest.rotation),
      );
    };
    const parentDelta: IAutoMovieQuaternion =
      joint.parent === null ? Quaternion.identity() : delta(joint.parent);
    const local: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(parentDelta),
      delta(bone),
    );
    const projected: number = local.x * axis.x + local.y * axis.y + local.z * axis.z;
    const twistSize: number = Math.hypot(local.w, projected);
    const twist: IAutoMovieQuaternion =
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
  const spreadAt: (one: IHumanBodyTwistSpread, p: IAutoMovieVector3) => IHumanBodyDualQuaternion = (
    one: IHumanBodyTwistSpread,
    p: IAutoMovieVector3,
  ): IHumanBodyDualQuaternion => {
    const fraction: number = Math.min(
      1,
      Math.max(
        0,
        Vector3.dot(Vector3.subtract(p, one.head), one.axis) / one.length,
      ),
    );
    const real: IAutoMovieQuaternion = Quaternion.multiply(one.base, power(one.twist, fraction));
    const translation: IAutoMovieVector3 = Vector3.subtract(
      one.posedHead,
      Quaternion.rotateVector(real, one.head),
    );
    const dual: IAutoMovieQuaternion = scale(
      Quaternion.multiply({ ...translation, w: 0 }, real),
      0.5,
    );
    // the same hemisphere as the bone's own, which its parent chose
    const sign: number = dot(one.reference, real) < 0 ? -1 : 1;
    return { real: scale(real, sign), dual: scale(dual, sign) };
  };
  // Toe rays split a vertex's toes weight among phalanges by their shares;
  // each phalanx joins the hemisphere of its side's toes bone. Rays without
  // transforms (no posed phalanx) leave the toes bone to skin alone.
  const rays: IHumanBodyDualQuaternion[] | null =
    toeSplit === undefined ||
    !toeSplit.bones.every((bone: string): boolean => transforms.has(bone))
      ? null
      : toeSplit.bones.map((bone: string): IHumanBodyDualQuaternion => {
          const transform: IAutoMovieHumanBodyBoneTransform = transforms.get(bone)!;
          const real: IAutoMovieQuaternion = Quaternion.multiply(
            transform.posed.rotation,
            Quaternion.inverse(transform.rest.rotation),
          );
          const translation: IAutoMovieVector3 = Vector3.subtract(
            transform.posed.position,
            Quaternion.rotateVector(real, transform.rest.position),
          );
          const dual: IAutoMovieQuaternion = scale(
            Quaternion.multiply({ ...translation, w: 0 }, real),
            0.5,
          );
          const toes: IHumanBodyDualQuaternion | undefined = aligned.get(
            bone.startsWith("left") ? "leftToes" : "rightToes",
          );
          const sign: number = toes !== undefined && dot(toes.real, real) < 0 ? -1 : 1;
          return { real: scale(real, sign), dual: scale(dual, sign) };
        });
  const rowOf: Map<number, number> = new Map<number, number>(
    (rays === null ? [] : toeSplit!.vertices).map((vertex: number, row: number): [number, number] => [
      vertex,
      row,
    ]),
  );
  const output: number[] = new Array<number>(positions.length);
  for (let v: number = 0; v < positions.length / 3; v++) {
    const real: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 0 };
    const dual: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 0 };
    for (let k: number = 0; k < 4; k++) {
      const weight: number = skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const index: number = skin.boneIndices[v * 4 + k];
      const row: number | undefined = rays === null ? undefined : rowOf.get(v);
      if (
        row !== undefined &&
        (skin.joints[index] === "leftToes" ||
          skin.joints[index] === "rightToes")
      ) {
        // shares divide the vertex's whole toes weight (both sides' toes slots
        // together, as at the midline of a few source vertices), so the rows
        // are applied once, at the first toes slot, and later toes slots skip
        let first: boolean = true;
        let total: number = 0;
        for (let j: number = 0; j < 4; j++) {
          const toes: typeof skin.joints[number] = skin.joints[skin.boneIndices[v * 4 + j]];
          if (
            skin.weights[v * 4 + j] === 0 ||
            (toes !== "leftToes" && toes !== "rightToes")
          )
            continue;
          if (j < k) first = false;
          total += skin.weights[v * 4 + j];
        }
        if (first)
          for (
            let r: number = toeSplit!.offsets[row];
            r < toeSplit!.offsets[row + 1];
            r++
          ) {
            const ray: IHumanBodyDualQuaternion = rays![toeSplit!.bonesIndex[r]];
            accumulate(real, ray.real, total * toeSplit!.shares[r]);
            accumulate(dual, ray.dual, total * toeSplit!.shares[r]);
          }
        continue;
      }
      const spreading: IHumanBodyTwistSpread | null = spread[index];
      const bone: IHumanBodyDualQuaternion =
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
    const size: number = Math.hypot(real.x, real.y, real.z, real.w);
    if (!(size > 0) || !Number.isFinite(size))
      throw new Error("Body dual-quaternion skin blend needs a finite nonzero real part at vertex " + v + ".");
    const normalizationScale: number = 1 / size;
    if (!Number.isFinite(normalizationScale))
      throw new Error("Body dual-quaternion skin blend normalization is not representable at vertex " + v + ".");
    const rotation: IAutoMovieQuaternion = scale(real, normalizationScale);
    const translation: IAutoMovieQuaternion = scale(
      Quaternion.multiply(scale(dual, normalizationScale), Quaternion.inverse(rotation)),
      2,
    );
    const moved: IAutoMovieVector3 = Vector3.add(
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
const power: (q: IAutoMovieQuaternion, t: number) => IAutoMovieQuaternion = (q: IAutoMovieQuaternion, t: number): IAutoMovieQuaternion => {
  const sign: number = q.w < 0 ? -1 : 1;
  const angle: number = Math.acos(Math.min(1, sign * q.w));
  const sine: number = Math.sin(angle);
  if (sine < 1e-12) return { x: 0, y: 0, z: 0, w: 1 };
  const k: number = (sign * Math.sin(t * angle)) / sine;
  return { x: q.x * k, y: q.y * k, z: q.z * k, w: Math.cos(t * angle) };
};

const dot: (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion) => number = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
  a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

const scale: (q: IAutoMovieQuaternion, s: number) => IAutoMovieQuaternion = (q: IAutoMovieQuaternion, s: number): IAutoMovieQuaternion => ({
  x: q.x * s,
  y: q.y * s,
  z: q.z * s,
  w: q.w * s,
});

const accumulate: (sum: IAutoMovieQuaternion, q: IAutoMovieQuaternion, s: number) => void = (
  sum: IAutoMovieQuaternion,
  q: IAutoMovieQuaternion,
  s: number,
): void => {
  sum.x += q.x * s;
  sum.y += q.y * s;
  sum.z += q.z * s;
  sum.w += q.w * s;
};
