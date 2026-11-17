import { measureAutoMovieHumanoidBody } from "@automovie/engine";
import {
  AutoMovieHumanCanonicalBody,
  type IAutoMovieHumanParameters,
} from "@automovie/human";
import type { IAutoMovieBodyMeasure } from "@automovie/interface";

/**
 * A polygon man of any Human parameters on the canonical rig, for local
 * motion checks and captures.
 *
 * The body is prepared by Human at the skeleton level
 * (`AutoMovieHumanCanonicalBody.prepare`: joints by closed-form placement
 * laws, girth radii from the person's measures, the T-pose and a contact
 * profile from the polygon's own primitives), tens of milliseconds a body
 * with no curve of the detailed figure built or solved; its measure is read
 * by the engine's `measureAutoMovieHumanoidBody`. Nothing is kept between
 * calls or on disk: a preparation costs less than reading and checking a
 * stored one against the sources it depends on.
 *
 * @param id Stable body id, used as the skeleton id.
 * @param params Human's parameters.
 * @param mass Body mass, kilograms.
 * @returns The canonical body and its measure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the preparation, its cost and that nothing is stored.
 * @evidence contracts/development/implementation.md#principled-implementation Human's skeleton-level canonical preparation, then the engine measurer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare, then measure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every call prepares the body from its parameters with the code as it stands, so no stored body can stand in for the current Human.
 * @evidence contracts/development/implementation.md#efficient-algorithms One closed-form preparation and one measurement per call; the dominant cost is the hull search of the body's colliders inside the preparation.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Coordinates no requests; a caller that needs one body twice holds the result.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing between calls.
 */
export function humanPolygonMan(
  id: string,
  params: IAutoMovieHumanParameters,
  mass: number,
): humanPolygonMan.IPolygonMan {
  const body: AutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(params, { mass, id });
  return {
    id,
    body,
    measure: measureAutoMovieHumanoidBody(body.skeleton, body.profile),
  };
}

/**
 * Companion types of {@link humanPolygonMan}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation Human's canonical body with the engine measure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the harness and the local motion tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses Human's canonical body and the interface measure.
 */
export namespace humanPolygonMan {
  /** A prepared polygon man. */
  export interface IPolygonMan {
    /** Stable id. */
    id: string;

    /** The canonical body. */
    body: AutoMovieHumanCanonicalBody.IBody;

    /** Its measure. */
    measure: IAutoMovieBodyMeasure;
  }
}
