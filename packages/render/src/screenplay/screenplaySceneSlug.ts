import type { IAutoMovieScenePayload } from "@automovie/interface";

/**
 * `INT. CASTLE COURTYARD - DAWN`: the screenplay slug of one scene, with the
 * location and time of day upper-cased.
 *
 * The screenplay document and the caption join both name a scene by this one
 * slug, so a caption's scene label always matches the document's heading.
 *
 * @evidence contracts/common.md#principled-implementation The scene payload's interior or exterior marker, uppercased location and uppercased time of day are joined with the screenplay's fixed heading punctuation.
 * @evidence contracts/common.md#clear-and-simple-design The shared slug formatter keeps screenplay headings and caption scene labels on one spelling rule without owning either document traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every supplied scene uses the same case conversion and punctuation; no location name or authored production receives a separate heading template.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the exact heading form and names the two consumers whose labels must agree.
 * @evidence contracts/performance.md#efficient-algorithms Uppercasing and joining cost linear time and space in the location and time-of-day strings, with no scene-tree traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work This small formatter keeps no memo table; the consuming traversal owns whether a scene heading is requested once or repeatedly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned heading is the only retained value and contains no reference to the scene payload or host resources.
 */
export const screenplaySceneSlug: (payload: Pick<IAutoMovieScenePayload, "interiorExterior" | "location" | "timeOfDay">) => string = (
  payload: Pick<
    IAutoMovieScenePayload,
    "interiorExterior" | "location" | "timeOfDay"
  >,
): string =>
  `${payload.interiorExterior}. ${payload.location.toUpperCase()} - ${payload.timeOfDay.toUpperCase()}`;
