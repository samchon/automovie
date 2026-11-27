import type {
  IAutoMovieSunDirection,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";

/**
 * Turn a solved sun position into the unit world direction from the site toward
 * the sun.
 *
 * The site's frame is built from the context: up is `ground.up` normalized,
 * north is `north` projected onto the ground plane and normalized, and east is
 * `north × up`, so with north along world -Z and up along +Y east is +X. The
 * direction is `cos(elevation) × (cos(azimuth) × north + sin(azimuth) × east) +
 * sin(elevation) × up`, the azimuth measured eastward from north.
 *
 * A staged sun light's `direction` is this vector negated, since a light's
 * local -Z is its direction of travel. The result is also the `sun` of an
 * `IAutoMovieEnvironmentInstant`.
 *
 * @param props The site's north and ground, and the sun position.
 * @returns Unit world vector toward the sun; below the ground plane when the
 *   elevation is negative.
 * @throws Error when `north` is parallel to `ground.up`, which leaves no
 *   heading on the ground plane.
 */
export function autoMovieSunDirection(
  props: IAutoMovieSunDirection.IProps,
): IAutoMovieVector3 {
  const up: IAutoMovieVector3 = Vector3.normalize(props.context.ground.up);
  const north: IAutoMovieVector3 = props.context.north;
  const horizontal: IAutoMovieVector3 = Vector3.subtract(
    north,
    Vector3.scale(up, Vector3.dot(north, up)),
  );
  if (!(Vector3.length(horizontal) > PARALLEL * Vector3.length(north)))
    throw new Error(
      "autoMovieSunDirection: context.north is parallel to context.ground.up, so it names no heading on the ground plane.",
    );

  const heading: IAutoMovieVector3 = Vector3.normalize(horizontal);
  const east: IAutoMovieVector3 = Vector3.cross(heading, up);
  const azimuth: number = (props.position.azimuth * Math.PI) / 180;
  const elevation: number = (props.position.elevation * Math.PI) / 180;
  const level: number = Math.cos(elevation);
  return Vector3.add(
    Vector3.add(
      Vector3.scale(heading, level * Math.cos(azimuth)),
      Vector3.scale(east, level * Math.sin(azimuth)),
    ),
    Vector3.scale(up, Math.sin(elevation)),
  );
}

/**
 * Smallest horizontal share of `north` that still names a heading. Below it,
 * `north` lies within about 0.2 arcseconds of the up axis, where rounding in
 * the projection decides the heading rather than the authored vector.
 */
const PARALLEL: number = 1e-6;
