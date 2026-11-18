import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * Prepare the linear blend of two clinical hand shapes: every bone either
 * shape names, a bone a shape leaves out read as zero, each axis at
 * `from + (to - from) * weight`.
 *
 * @param from The first shape, clinical degrees by bone; read now.
 * @param to The second shape in the same axes; read now.
 * @returns The blend at a unitless weight, fresh tuples, without clipping or a time profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the key union, the zero default, the blend formula and when the shapes are read.
 * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation per clinical axis; HumanPrehension owns the minimum-jerk timing and HumanPreshape the aperture bisection that feed it weights.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation of each bone's origin and difference, one loop per weight; the one blend owner for prepared schedules and one-off blends alike.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clipping, angle wrapping or tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(D) preparation for D bones, O(D) per weight.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The differences depend only on the two shapes, read at preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds D names, origins and differences until released, and no reference to either shape.
 */
export function prepareHumanShapeBlend(from: Readonly<IAutoMovieMotionHumanPosture["joints"]>,
  to: Readonly<IAutoMovieMotionHumanPosture["joints"]>): (weight: number) => IAutoMovieMotionHumanPosture["joints"] {
  const keys: IKey[] = [...new Set([...Object.keys(from), ...Object.keys(to)])].map((name: string): IKey => {
    const bone: AutoMovieHumanoidBone = name as AutoMovieHumanoidBone;
    const a: readonly [number, number, number] = from[bone] ?? ZERO;
    const b: readonly [number, number, number] = to[bone] ?? ZERO;
    return { bone, origin: [a[0], a[1], a[2]], difference: [b[0] - a[0], b[1] - a[1], b[2] - a[2]] };
  });
  return (weight: number): IAutoMovieMotionHumanPosture["joints"] => {
    const out: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const { bone, origin, difference } of keys) out[bone] = [
      origin[0] + difference[0] * weight,
      origin[1] + difference[1] * weight,
      origin[2] + difference[2] * weight,
    ];
    return out;
  };
}

/** One bone's first-shape angles and second-minus-first difference, clinical degrees. */
interface IKey {
  /** The bone. */
  bone: AutoMovieHumanoidBone;

  /** The first shape's three clinical angles. */
  origin: readonly [number, number, number];

  /** The second shape's angles less the first's. */
  difference: readonly [number, number, number];
}

/** The angles of a bone a shape leaves out. */
const ZERO: readonly [0, 0, 0] = [0, 0, 0];
