import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { AutoMovieSweepRotation } from "./AutoMovieSweepRotation";
import { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";

/**
 * Create the motion buffers of a rest skeleton.
 *
 * `update` computes each bone's rotation `Q_b R_b^-1`, normalized, and keeps
 * its rest and posed origins, so `apply` moves a point by
 * `P_b + Q_b R_b^-1 (p - O_b)` as `createAutoMovieBoneMotion` does.
 *
 * @param rest Bones at rest, from `resolvePose` of an empty pose; only read.
 * @returns The buffer, every motion the identity until updated.
 *
 * @evidence contracts/common.md#principled-implementation The same rigid motion `createAutoMovieBoneMotion` builds, computed into arrays.
 * @evidence contracts/common.md#clear-and-simple-design Name resolution once at creation, index access per pose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A posed list out of step with the rest list is refused; it is not reordered.
 * @evidence contracts/common.md#meaningful-documentation States the transform and its source.
 * @evidence contracts/performance.md#efficient-algorithms O(B) to index B bones; `update` is O(B) and each point or direction constant time, none allocating.
 * @evidence contracts/performance.md#reuse-equivalent-work Each bone's rotation is computed once per pose and shared by every point and direction riding it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains 10 B numbers and the name index, released with the buffer.
 */
export const bufferAutoMovieBones: (rest: readonly IAutoMovieResolvedBone[]) => IAutoMovieBoneBuffer = (
  rest: readonly IAutoMovieResolvedBone[],
): IAutoMovieBoneBuffer => {
  const count: number = rest.length;
  const bones: AutoMovieHumanoidBone[] = rest.map((b: IAutoMovieResolvedBone): AutoMovieHumanoidBone => b.bone);
  const names: Map<AutoMovieHumanoidBone, number> = new Map(
    bones.map((b: AutoMovieHumanoidBone, i: number): [AutoMovieHumanoidBone, number] => [b, i]),
  );
  // rest rotations inverted, rest origins, posed origins, rotations from rest to pose
  const inverse: Float64Array = new Float64Array(4 * count);
  const origins: Float64Array = new Float64Array(3 * count);
  const posed: Float64Array = new Float64Array(3 * count);
  const rotations: Float64Array = new Float64Array(4 * count);
  rest.forEach((b: IAutoMovieResolvedBone, i: number): void => {
    inverse.set([b.worldRotation.x, b.worldRotation.y, b.worldRotation.z, b.worldRotation.w], 4 * i);
    AutoMovieSweepRotation.normalize(inverse, 4 * i);
    AutoMovieSweepRotation.conjugate(inverse, 4 * i, inverse, 4 * i);
    origins.set([b.worldPosition.x, b.worldPosition.y, b.worldPosition.z], 3 * i);
  });
  const reset = (): void => {
    for (let i: number = 0; i < count; ++i) {
      rotations[4 * i] = 0;
      rotations[4 * i + 1] = 0;
      rotations[4 * i + 2] = 0;
      rotations[4 * i + 3] = 1;
      for (let a: number = 0; a < 3; ++a) posed[3 * i + a] = origins[3 * i + a]!;
    }
  };
  reset();
  const update = (list: readonly IAutoMovieResolvedBone[]): void => {
    if (list.length !== count) throw new Error(`posed bones number ${list.length}, rest bones ${count}`);
    for (let i: number = 0; i < count; ++i) {
      const b: IAutoMovieResolvedBone = list[i]!;
      if (b.bone !== bones[i]) throw new Error(`posed bone ${i} is ${b.bone}, rest bone ${bones[i]}`);
      const o: number = 4 * i;
      rotations[o] = b.worldRotation.x;
      rotations[o + 1] = b.worldRotation.y;
      rotations[o + 2] = b.worldRotation.z;
      rotations[o + 3] = b.worldRotation.w;
      AutoMovieSweepRotation.multiply(rotations, o, inverse, o, rotations, o);
      AutoMovieSweepRotation.normalize(rotations, o);
      posed[3 * i] = b.worldPosition.x;
      posed[3 * i + 1] = b.worldPosition.y;
      posed[3 * i + 2] = b.worldPosition.z;
    }
  };
  const turn = (bone: number, v: ArrayLike<number>, vi: number, out: Float64Array, oi: number): void =>
    AutoMovieSweepRotation.rotate(rotations, 4 * bone, v, vi, out, oi);
  const apply = (bone: number, p: ArrayLike<number>, pi: number, out: Float64Array, oi: number): void => {
    const o: number = 3 * bone;
    out[oi] = p[pi]! - origins[o]!;
    out[oi + 1] = p[pi + 1]! - origins[o + 1]!;
    out[oi + 2] = p[pi + 2]! - origins[o + 2]!;
    AutoMovieSweepRotation.rotate(rotations, 4 * bone, out, oi, out, oi);
    out[oi] = out[oi]! + posed[o]!;
    out[oi + 1] = out[oi + 1]! + posed[o + 1]!;
    out[oi + 2] = out[oi + 2]! + posed[o + 2]!;
  };
  return {
    bones,
    index: (bone: AutoMovieHumanoidBone): number => {
      const i: number | undefined = names.get(bone);
      if (i === undefined) throw new Error(`bone ${bone} is missing from the rest or posed bones`);
      return i;
    },
    update,
    reset,
    apply,
    turn,
    rotations,
  };
};
