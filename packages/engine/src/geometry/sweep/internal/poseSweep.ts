import {
  type AutoMovieHumanoidBone,
  type IAutoMoviePoseSweep,
  IAutoMovieQuaternion,
  type IAutoMovieSweep,
  type IAutoMovieSweepFrame,
  type IAutoMovieSweepSpine,
  type IAutoMovieSweepSurface,
  type IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../../math/AutoMovieEngineQuaternion";
import { quaternionFromBasis } from "../../../math/internal/quaternionFromBasis";
import { compileSweep } from "./compileSweep";
import { createBoneMotion } from "./createBoneMotion";
import { interpolateSpline } from "./interpolateSpline";
import { measureSweepVolume } from "./measureSweepVolume";
import { settleSweepVolume } from "./settleSweepVolume";

/*
 * Re-sweep a sweep in a pose: move its spine and section planes with the bones
 * they ride and rebuild the surface from them, sweep-based deformation after
 * Hyun, Yoon, Chang, Seong, Kim and Juttler (2005, "Sweep-based human
 * deformation", The Visual Computer 21(8-10):542-550).
 *
 * Each spine point moves rigidly with its bone, and the spine's starting
 * direction and any declared end tangents turn with the first or last point's
 * bone. Each station's rest plane, its own rotation or the rest sweep's frame
 * at its `at`, turns with its bone; a station on two bones takes the spherical
 * midpoint of the two turned planes. The posed sweep carries those planes as
 * station rotations, so between stations the turn relative to the posed spine's
 * rotation-minimizing frame is interpolated by normalized linear quaternion
 * interpolation: a twist at one station spreads evenly to the next instead of
 * wringing the surface beside one joint, and sections at a bent joint stay
 * across the tube rather than collapsing into it. Sections, guides, scale and
 * features are kept as they are, so the surface keeps its shape in each section
 * plane.
 *
 * With `preserveVolume`, the sections of stations on two bones are scaled
 * together by one factor until the posed volume, by
 * `measureSweepVolume`, equals the rest volume: the scale profile
 * gains a knot at every station, the factor at joint stations and 1 at the
 * others, multiplied into any existing profile, and the factor is found by
 * secant steps, as the paper first rescales the key section at the bent joint
 * (Section 4.4), by `settleSweepVolume`. Without joint stations the
 * sweep is returned unscaled. The scale applies after features, so the
 * section's shape is unchanged and only its size at the joints moves.
 * Parameter props.sweep: The rest sweep, only read.
 * Parameter props.binding: Bones of its spine points and stations.
 * Parameter props.rest: Bones at rest.
 * Parameter props.posed: The same bones posed.
 * Parameter props.preserveVolume: Whether to rescale joint sections to the rest
 * volume; omitted, false.
 * Returns: The posed sweep, a new record sharing the rest sweep's sections.
 * Error when the binding does not align with the sweep, a bone is
 * missing, or the rest sweep is refused by `compileSweep`.
 */
export const poseSweep: (
  props: IAutoMoviePoseSweep.IProps,
) => IAutoMovieSweep = (props: IAutoMoviePoseSweep.IProps): IAutoMovieSweep => {
  const { sweep, binding }: typeof props = props;
  if (binding.points.length !== sweep.spine.points.length)
    throw new Error("sweep binding needs one bone per spine point");
  if (binding.stations.length !== sweep.stations.length)
    throw new Error("sweep binding needs one bone or joint per station");
  const motion: (bone: AutoMovieHumanoidBone) => {
    rotation: IAutoMovieQuaternion;
    apply: (point: IAutoMovieVector3) => IAutoMovieVector3;
  } = createBoneMotion({
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
            start: AutoMovieEngineQuaternion.rotateVector(
              motion(binding.points[0]!).rotation,
              t.start,
            ),
          }),
      ...(t.end === undefined
        ? {}
        : {
            end: AutoMovieEngineQuaternion.rotateVector(
              motion(binding.points[binding.points.length - 1]!).rotation,
              t.end,
            ),
          }),
    };
  }
  const rest: IAutoMovieSweepSurface = compileSweep(sweep);
  const stations: IAutoMovieSweep.IStation[] = sweep.stations.map(
    (
      station: IAutoMovieSweep.IStation,
      k: number,
    ): IAutoMovieSweep.IStation => {
      const f: IAutoMovieSweepFrame = rest.frame(station.at);
      const plane: IAutoMovieQuaternion = quaternionFromBasis(
        f.x,
        f.y,
        f.normal,
      );
      const turned: IAutoMovieQuaternion[] = binding.stations[k]!.map(
        (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion =>
          AutoMovieEngineQuaternion.normalize(
            AutoMovieEngineQuaternion.multiply(motion(bone).rotation, plane),
          ),
      );
      return {
        ...station,
        rotation:
          turned.length === 1
            ? turned[0]!
            : AutoMovieEngineQuaternion.slerp(turned[0]!, turned[1]!, 0.5),
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
      normal: AutoMovieEngineQuaternion.rotateVector(
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
  const target: number = measureSweepVolume(rest);
  const previous: ((u: number) => number) | null =
    sweep.scale === undefined
      ? null
      : interpolateSpline({
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
    return measureSweepVolume(compileSweep(scaled(factor)));
  }
  return scaled(settleSweepVolume(target, volume));
};
