import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";

const KIND_REGISTRY = AuthoringReachabilityRules.KIND_REGISTRY;

/**
 * Whether an untyped selection names one production shape the matrix covers.
 *
 * @evidence requirements/product/authorability.md#product-discoverable-control Lets a command refuse a shape the matrix does not publish instead of printing an empty route set.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-choice-discovery Decides shape membership from the same closed inventory the route query is built from.
 */
export const isAutoMovieAuthoringProductionKind = (
  value: unknown,
): value is AutoMovieAuthoringProductionKind =>
  typeof value === "string" && Object.hasOwn(KIND_REGISTRY, value);
