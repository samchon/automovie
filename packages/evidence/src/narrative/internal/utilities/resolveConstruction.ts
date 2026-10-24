import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionConstructionStageMixin } from "../../ProductionConstructionStageMixin";

/**
 * Normalizes a construction stage and its screenplay scripts-source flag.
 *
 * A bare stage selects scripts naturalness when used for screenplay. Other layers
 * ignore the source flag and require their documentary parent's construction.
 * Both source choices read the current body.
 *
 * @evidence contracts/common.md#principled-implementation A bare construction stage is normalized to a stage/source tuple with the scripts-naturalness flag true, while an existing tuple is returned unchanged; downstream owners ignore that flag outside screenplay.
 * @evidence contracts/common.md#clear-and-simple-design One normalization helper supplies consistent stage and optional screenplay parent-edition semantics to all claim and dependency builders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The true default is the declared screenplay source choice, not a fallback after validation failure; tuple shape and allowed stages are checked separately at configuration admission.
 * @evidence contracts/common.md#meaningful-documentation The prose explains the bare-stage default, which layer consumes the flag and that either source edition addresses current promoted body paths.
 * @evidence contracts/performance.md#efficient-algorithms A type test and at most one two-entry allocation take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work An already normalized tuple is reused by identity, while scalar inputs create a new pair; there is no shared mutable cache across configurations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned tuple is caller-owned or the original caller input; no module state, handle or task is retained.
 */
export function resolveConstruction(
  construction: IProductionConfigProps["construction"][AuthoredLayer],
): ProductionConstructionStageMixin {
  return typeof construction === "string" ? [construction, true] : construction;
}
