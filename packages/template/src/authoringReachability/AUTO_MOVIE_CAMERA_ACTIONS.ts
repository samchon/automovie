import type { IAutoMovieActionCall } from "@automovie/interface";

type AutoMovieCameraAction = Extract<
  IAutoMovieActionCall,
  { verb: "frame" }
>["move"];

/**
 * Closed literal vocabularies, each pinned to the interface union it publishes.
 *
 * `satisfies Record<Union, true>` fails to compile when the interface gains or
 * loses a literal, so the route matrix cannot advertise a choice the builder
 * does not accept or hide one it does.
 */
const CAMERA_ACTION_REGISTRY = {
  static: true,
  follow: true,
  orbit: true,
  "push-in": true,
  truck: true,
  whip: true,
} satisfies Record<AutoMovieCameraAction, true>;

/**
 * Closed camera-action vocabulary consumed by the shot builder.
 *
 * @evidence requirements/product/authorability.md#product-discoverable-control Publishes the exact executable camera literals as the queryable choice set instead of broader film terminology.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-choice-discovery Makes the builder-supported camera choices discoverable through the authoring route.
 */
export const AUTO_MOVIE_CAMERA_ACTIONS: readonly AutoMovieCameraAction[] =
  Object.freeze(Object.keys(CAMERA_ACTION_REGISTRY) as AutoMovieCameraAction[]);
