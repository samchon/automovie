import {
  type AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  type IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { Quaternion } from "../../math/Quaternion";
import { quaternionFromAutoMovieBasis } from "../../math/quaternionFromAutoMovieBasis";
import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepSpine } from "./IAutoMovieSweepSpine";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import { compileAutoMovieSweep } from "./compileAutoMovieSweep";
import { createAutoMovieBoneMotion } from "./createAutoMovieBoneMotion";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";
import { measureAutoMovieSweepVolume } from "./measureAutoMovieSweepVolume";
import { settleAutoMovieSweepVolume } from "./settleAutoMovieSweepVolume";

/**
 * Re-sweep a sweep in a pose: move its spine and section planes with the bones
 * they ride and rebuild the surface from them, sweep-based deformation after
 * Hyun, Yoon, Chang, Seong, Kim and Juttler (2005, "Sweep-based human
 * deformation", The Visual Computer 21(8-10):542-550).
 *
 * Each spine point moves rigidly with its bone, and the spine's starting
 * direction and any declared end tangents turn with the first or last
 * point's bone. Each station's rest plane, its
 * own rotation or the rest sweep's frame at its `at`, turns with its bone; a
 * station on two bones takes the spherical midpoint of the two turned planes.
 * The posed sweep carries those planes as station rotations, so between
 * stations the turn relative to the posed spine's rotation-minimizing frame is
 * interpolated by normalized linear quaternion interpolation: a twist at one
 * station spreads evenly to the next instead of wringing the surface beside
 * one joint, and sections at a bent joint stay across the tube rather than
 * collapsing into it. Sections, guides, scale and features are kept as they
 * are, so the surface keeps its shape in each section plane.
 *
 * With `preserveVolume`, the sections of stations on two bones are scaled
 * together by one factor until the posed volume, by
 * `measureAutoMovieSweepVolume`, equals the rest volume: the scale profile
 * gains a knot at every station, the factor at joint stations and 1 at the
 * others, multiplied into any existing profile, and the factor is found by
 * secant steps, as the paper first rescales the key section at the bent joint
 * (Section 4.4), by `settleAutoMovieSweepVolume`. Without joint stations the
 * sweep is returned unscaled. The scale applies after features, so the
 * section's shape is unchanged and only its size at the joints moves.
 *
 * @param props.sweep The rest sweep, only read.
 * @param props.binding Bones of its spine points and stations.
 * @param props.rest Bones at rest.
 * @param props.posed The same bones posed.
 * @param props.preserveVolume Whether to rescale joint sections to the rest volume; omitted, false.
 * @returns The posed sweep, a new record sharing the rest sweep's sections.
 * @throws Error when the binding does not align with the sweep, a bone is missing, or the rest sweep is refused by `compileAutoMovieSweep`.
 *
 * @evidence contracts/common.md#principled-implementation Sweep-based deformation: key sections ride their links or turn with both links at a joint, the centre curve and orientations are re-interpolated in the pose, and volume is restored by rescaling the joint section using the swept-volume integral. Limitation: sections on the inside of a tight bend may still cross; the paper resolves that with collision handling, which is not implemented.
 * @evidence contracts/common.md#clear-and-simple-design Posing produces an ordinary sweep, so sampling, tiers and fitting are reused unchanged for posed surfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Misaligned bindings are refused, and volume preservation changes only the declared joint stations' scale rather than any other parameter.
 * @evidence contracts/common.md#meaningful-documentation States how points, planes and joint stations move, the interpolation, the volume rule and its source, and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms O(N + S) for N spine points and S stations, plus one rest compile; volume preservation adds at most nine compiles and volume integrals of O(400 * 256) radius queries each.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call poses one sweep; the bone motion lookup caches each bone's rotation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the compiled surfaces used for frames and volume are released on return.
 */
export const poseAutoMovieSweep: (props: {
  sweep: IAutoMovieSweep;
  binding: IAutoMovieSweepBinding;
  rest: readonly IAutoMovieResolvedBone[];
  posed: readonly IAutoMovieResolvedBone[];
  preserveVolume?: boolean;
}) => IAutoMovieSweep = (props: {
  sweep: IAutoMovieSweep;
  binding: IAutoMovieSweepBinding;
  rest: readonly IAutoMovieResolvedBone[];
  posed: readonly IAutoMovieResolvedBone[];
  preserveVolume?: boolean;
}): IAutoMovieSweep => {
  const { sweep, binding }: typeof props = props;
  if (binding.points.length !== sweep.spine.points.length)
    throw new Error("sweep binding needs one bone per spine point");
  if (binding.stations.length !== sweep.stations.length)
    throw new Error("sweep binding needs one bone or joint per station");
  const motion: (bone: AutoMovieHumanoidBone) => {
    rotation: IAutoMovieQuaternion;
    apply: (point: IAutoMovieVector3) => IAutoMovieVector3;
  } = createAutoMovieBoneMotion({
    rest: props.rest,
    posed: props.posed,
  });
  // declared end tangents turn with the bones of the first and last points
  function turnTangents(
    t: NonNullable<IAutoMovieSweepSpine["tangents"]>,
  ): NonNullable<IAutoMovieSweepSpine["tangents"]> {
    return {
      ...(t.start === undefined
        ? {}
        : {
            start: Quaternion.rotateVector(
              motion(binding.points[0]!).rotation,
              t.start,
            ),
          }),
      ...(t.end === undefined
        ? {}
        : {
            end: Quaternion.rotateVector(
              motion(binding.points[binding.points.length - 1]!).rotation,
              t.end,
            ),
          }),
    };
  }
  const rest: IAutoMovieSweepSurface = compileAutoMovieSweep(sweep);
  const stations: IAutoMovieSweep.IStation[] = sweep.stations.map(
    (
      station: IAutoMovieSweep.IStation,
      k: number,
    ): IAutoMovieSweep.IStation => {
      const f: IAutoMovieSweepFrame = rest.frame(station.at);
      const plane: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(
        f.x,
        f.y,
        f.normal,
      );
      const turned: IAutoMovieQuaternion[] = binding.stations[k]!.map(
        (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion =>
          Quaternion.normalize(
            Quaternion.multiply(motion(bone).rotation, plane),
          ),
      );
      return {
        ...station,
        rotation:
          turned.length === 1
            ? turned[0]!
            : Quaternion.slerp(turned[0]!, turned[1]!, 0.5),
      };
    },
  );
  const posed: IAutoMovieSweep = {
    ...sweep,
    spine: {
      points: sweep.spine.points.map(
        (p: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
          motion(binding.points[k]!).apply(p),
      ),
      normal: Quaternion.rotateVector(
        motion(binding.points[0]!).rotation,
        sweep.spine.normal,
      ),
      ...(sweep.spine.tangents === undefined
        ? {}
        : { tangents: turnTangents(sweep.spine.tangents) }),
    },
    stations,
  };
  const joints: boolean[] = binding.stations.map(
    (
      b:
        | [AutoMovieHumanoidBone, AutoMovieHumanoidBone]
        | [AutoMovieHumanoidBone],
    ): boolean => b.length === 2,
  );
  if (
    !(props.preserveVolume ?? false) ||
    !joints.some((j: boolean): boolean => j)
  )
    return posed;
  const target: number = measureAutoMovieSweepVolume(rest);
  const previous: ((u: number) => number) | null =
    sweep.scale === undefined
      ? null
      : interpolateAutoMovieSpline({
          knots: sweep.scale.map((k: IAutoMovieSweep.IKnot): number => k.at),
          values: sweep.scale.map(
            (k: IAutoMovieSweep.IKnot): number => k.value,
          ),
        });
  const knots: number[] = [
    ...new Set([
      0,
      1,
      ...sweep.stations.map((s: IAutoMovieSweep.IStation): number => s.at),
      ...(sweep.scale ?? []).map((k: IAutoMovieSweep.IKnot): number => k.at),
    ]),
  ].sort((a: number, b: number): number => a - b);
  const jointAt: Set<number> = new Set(
    sweep.stations
      .filter((_: IAutoMovieSweep.IStation, k: number): boolean => joints[k]!)
      .map((s: IAutoMovieSweep.IStation): number => s.at),
  );
  function scaled(factor: number): IAutoMovieSweep {
    return {
      ...posed,
      scale: knots.map(
        (at: number): IAutoMovieSweep.IKnot => ({
          at,
          value: (previous?.(at) ?? 1) * (jointAt.has(at) ? factor : 1),
        }),
      ),
    };
  }
  function volume(factor: number): number {
    return measureAutoMovieSweepVolume(compileAutoMovieSweep(scaled(factor)));
  }
  return scaled(settleAutoMovieSweepVolume(target, volume));
};
