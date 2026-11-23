import { measureAutoMovieHumanoidBody } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieBodyMeasure,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanParameters,
} from "@automovie/interface";

/**
 * A polygon man of any Human parameters on the canonical rig, for local motion
 * checks and captures.
 *
 * The body is prepared by Human at the skeleton level
 * (`AutoMovieHumanCanonicalBody.prepare`: joints by closed-form placement laws,
 * girth radii from the person's measures, the T-pose and a contact profile from
 * the polygon's own primitives), tens of milliseconds a body with no curve of
 * the detailed figure built or solved; its measure is read by the engine's
 * `measureAutoMovieHumanoidBody`. Nothing is kept between calls or on disk: a
 * preparation costs less than reading and checking a stored one against the
 * sources it depends on.
 *
 * @param id Stable body id, used as the skeleton id.
 * @param params Human's parameters.
 * @param mass Body mass, kilograms.
 * @returns The canonical body and its measure.
 */
export function humanPolygonMan(
  id: string,
  params: IAutoMovieHumanParameters,
  mass: number,
): humanPolygonMan.IPolygonMan {
  const body: IAutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(params, { mass, id });
  return {
    id,
    body,
    measure: measureAutoMovieHumanoidBody(body.skeleton, body.profile),
  };
}

/** Companion types of {@link humanPolygonMan}. */
export namespace humanPolygonMan {
  /** A prepared polygon man. */
  export interface IPolygonMan {
    /** Stable id. */
    id: string;

    /** The canonical body. */
    body: IAutoMovieHumanCanonicalBody.IBody;

    /** Its measure. */
    measure: IAutoMovieBodyMeasure;
  }
}
