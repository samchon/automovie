import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";

const KIND_REGISTRY = AuthoringReachabilityRules.KIND_REGISTRY;

/** Every production shape the route matrix answers for, in ladder order. */
export const AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS: readonly AutoMovieAuthoringProductionKind[] =
  Object.freeze(
    Object.keys(KIND_REGISTRY) as AutoMovieAuthoringProductionKind[],
  );
