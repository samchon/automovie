import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/*
 * Prepare the linear blend of two clinical joint maps (two hand shapes, or two
 * postures' or exercise keys' joints): every bone either map names, a bone a
 * map leaves out read as zero, each axis at `from + (to - from) * weight`. It
 * is the one owner of a linear joint-space blend; a joint blended as a rotation
 * is `blendHumanJoint`'s.
 * Parameter from: The first shape, clinical degrees by bone; read now.
 * Parameter to: The second shape in the same axes; read now.
 * Returns: The blend at a unitless weight, fresh tuples, without clipping or a
 * time profile.
 */
export function prepareHumanShapeBlend(
  from: Readonly<IAutoMovieMotionHumanPosture["joints"]>,
  to: Readonly<IAutoMovieMotionHumanPosture["joints"]>,
): (weight: number) => IAutoMovieMotionHumanPosture["joints"] {
  const keys: IKey[] = [
    ...new Set([...Object.keys(from), ...Object.keys(to)]),
  ].map((name: string): IKey => {
    const bone: AutoMovieHumanoidBone = name as AutoMovieHumanoidBone;
    const a: readonly [number, number, number] = from[bone] ?? ZERO;
    const b: readonly [number, number, number] = to[bone] ?? ZERO;
    return {
      bone,
      origin: [a[0], a[1], a[2]],
      difference: [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    };
  });
  return (weight: number): IAutoMovieMotionHumanPosture["joints"] => {
    const out: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const { bone, origin, difference } of keys)
      out[bone] = [
        origin[0] + difference[0] * weight,
        origin[1] + difference[1] * weight,
        origin[2] + difference[2] * weight,
      ];
    return out;
  };
}

/*
 * One bone's first-shape angles and second-minus-first difference, clinical
 * degrees.
 */
interface IKey {
  /*
   * The bone.
   */
  bone: AutoMovieHumanoidBone;

  /*
   * The first shape's three clinical angles.
   */
  origin: readonly [number, number, number];

  /*
   * The second shape's angles less the first's.
   */
  difference: readonly [number, number, number];
}

/*
 * The angles of a bone a shape leaves out.
 */
const ZERO: readonly [0, 0, 0] = [0, 0, 0];
