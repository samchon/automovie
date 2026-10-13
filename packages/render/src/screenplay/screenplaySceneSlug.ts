import type { IAutoMovieScenePayload } from "@automovie/interface";

/**
 * `INT. CASTLE COURTYARD - DAWN`: the screenplay slug of one scene, with the
 * location and time of day upper-cased.
 *
 * The screenplay document and the caption join both name a scene by this one
 * slug, so a caption's scene label always matches the document's heading.
 *
 * @author Samchon
 */
export const screenplaySceneSlug = (
  payload: Pick<
    IAutoMovieScenePayload,
    "interiorExterior" | "location" | "timeOfDay"
  >,
): string =>
  `${payload.interiorExterior}. ${payload.location.toUpperCase()} - ${payload.timeOfDay.toUpperCase()}`;
