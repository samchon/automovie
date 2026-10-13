import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";

const KIND_REGISTRY = AuthoringReachabilityRules.KIND_REGISTRY;

/**
 * Whether an untyped selection names one production shape the matrix covers.
 */
export const isAutoMovieAuthoringProductionKind = (
  value: unknown,
): value is AutoMovieAuthoringProductionKind =>
  typeof value === "string" && Object.hasOwn(KIND_REGISTRY, value);
