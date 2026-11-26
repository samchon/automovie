import type {
  IAutoMovieSkyIlluminance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieHemisphereDirections } from "./internal/autoMovieHemisphereDirections";
import { autoMovieRayObstructed } from "./internal/autoMovieRayObstructed";
import { autoMovieSkyward } from "./internal/autoMovieSkyward";

/**
 * Prepare the isotropic sky term `DHI × V` of one plane orientation, and return
 * the function that measures it at a point.
 *
 * `V` is the fraction of `count` deterministic cosine-weighted directions
 * around `normal` that rise above the reference ground and reach the sky
 * without crossing a solid. The directions and their horizon test depend on the
 * normal and the ground alone, so they are settled once here and reused at
 * every point the returned function measures; each point then casts one ray per
 * open direction. Directions under the horizon still count in the denominator,
 * so a tilted plane loses the sky it cannot see.
 *
 * An unobstructed plane facing the ground's up sees every direction, so its
 * estimate equals `illuminance` with no sampling error; a tilted or shaded
 * plane's estimate depends on `count`. Throws, through
 * `autoMovieHemisphereDirections`, when `count` is not a positive safe integer
 * or `normal` is zero or non-finite.
 *
 * @param props Plane normal, ground, direction count, sky illuminance and
 *   solids.
 * @returns The sky illuminance in lux at a world point on the plane.
 */
export const autoMovieSkyIlluminance: (
  props: IAutoMovieSkyIlluminance.IProps,
) => (point: IAutoMovieVector3) => number = (
  props: IAutoMovieSkyIlluminance.IProps,
): ((point: IAutoMovieVector3) => number) => {
  const open: IAutoMovieVector3[] = autoMovieHemisphereDirections({
    normal: props.normal,
    count: props.count,
  }).filter((direction: IAutoMovieVector3): boolean =>
    autoMovieSkyward(direction, props.ground),
  );
  return (point: IAutoMovieVector3): number => {
    let visible: number = 0;
    for (const direction of open)
      if (
        !autoMovieRayObstructed({
          origin: point,
          direction,
          solids: props.solids,
          maxDistance: Infinity,
        })
      )
        ++visible;
    return (props.illuminance * visible) / props.count;
  };
};
