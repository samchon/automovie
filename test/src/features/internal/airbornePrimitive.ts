import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The identity orientation of a principal frame. */
const STILL: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * A primitive body: point-like parts of given mass and principal moments, each
 * riding a bone at the bone's own origin.
 *
 * @param parts The bone, mass in kilograms and principal moments in kg m^2 of
 *   each part.
 * @returns The centre-of-mass model of those parts.
 */
export const airbornePrimitive: (
  parts: {
    bone: AutoMovieHumanoidBone;
    mass: number;
    inertia: IAutoMovieVector3;
  }[],
) => IAutoMovieResolveCenterOfMass.IModel = (
  parts: {
    bone: AutoMovieHumanoidBone;
    mass: number;
    inertia: IAutoMovieVector3;
  }[],
): IAutoMovieResolveCenterOfMass.IModel => ({
  mass: parts.reduce(
    (sum: number, part: { mass: number }): number => sum + part.mass,
    0,
  ),
  segments: parts.map(
    (part: {
      bone: AutoMovieHumanoidBone;
      mass: number;
      inertia: IAutoMovieVector3;
    }): IAutoMovieResolveCenterOfMass.ISegment => ({
      bone: part.bone,
      mass: part.mass,
      point: { x: 0, y: 0, z: 0 },
      inertia: part.inertia,
      axes: STILL,
    }),
  ),
});
