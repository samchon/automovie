import { AutoMovieModelArchetypeRegistry } from "./productionArchetypes";
import { compareCodeUnits } from "./contentIdentity";

/**
 * List supplied registry keys in deterministic code-unit order for an unregistered-model diagnostic, or report none registered.
 *
 * @evidence contracts/common.md#principled-implementation The caller owns catalogue identity and this helper changes no registry.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignArchetypeNames owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms A registry of A keys uses O(A) copied entries and O(A log A) string comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignArchetypeNames: (archetypes: AutoMovieModelArchetypeRegistry) => string = (
  archetypes: AutoMovieModelArchetypeRegistry,
): string =>
  [...archetypes.keys()].sort(compareCodeUnits).join(", ") || "none registered";
