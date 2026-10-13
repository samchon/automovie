import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";

const KIND_REGISTRY = AuthoringReachabilityRules.KIND_REGISTRY;

/**
 * Every production shape the route matrix answers for, in ladder order.
 *
 * @evidence requirements/product/authorability.md#product-discoverable-control Publishes the closed shape vocabulary the route query accepts.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-choice-discovery Keeps the runtime kind inventory equal to the typed shape dimension.
 */
export const AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS: readonly AutoMovieAuthoringProductionKind[] =
  Object.freeze(
    Object.keys(KIND_REGISTRY) as AutoMovieAuthoringProductionKind[],
  );
