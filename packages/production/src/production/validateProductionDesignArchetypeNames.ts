import { AutoMovieModelArchetypeRegistry } from "./productionArchetypes";
import { compareCodeUnits } from "./contentIdentity";

/**
 * List supplied registry keys in deterministic code-unit order for an unregistered-model diagnostic, or report none registered.
 *
 * @evidence contracts/common.md#principled-implementation Copies Map keys, code-unit sorts them and joins with comma-space so diagnostics reflect the supplied registry independently of insertion order or locale. The model validator supplies the current catalogue.
 * @evidence contracts/common.md#clear-and-simple-design Registration admission remains in the model gate; this helper only formats its available-name correction text.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only supplied registry keys appear; no built-in catalogue or consumer-specific suggestion replaces an empty registry.
 * @evidence contracts/common.md#meaningful-documentation States sorted-name presentation and the empty joined-result fallback none registered; registry values and membership remain unchanged and no model is selected.
 * @evidence contracts/performance.md#efficient-algorithms A registry of A keys uses O(A) copied entries and O(A log A) string comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current keys are copied and formatted for each refusal; this stateless formatter coordinates no cached or pending work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The copied key array is temporary and the caller receives one joined string; this formatter retains neither the registry nor a handle or task.
 */
export const validateProductionDesignArchetypeNames: (archetypes: AutoMovieModelArchetypeRegistry) => string = (
  archetypes: AutoMovieModelArchetypeRegistry,
): string =>
  [...archetypes.keys()].sort(compareCodeUnits).join(", ") || "none registered";
