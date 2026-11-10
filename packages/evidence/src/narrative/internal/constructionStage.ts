import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import type { ProductionStage } from "../ProductionStage";

/**
 * Reads one layer's construction stage, treating an omitted brief stage as disabled.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The brief stage is optional so configurations written before the short route gained its canon keep their meaning; every other layer's stage is required and read as given.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Every claim factory and the source check read stages through this one accessor instead of indexing the construction object.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the omitted optional key defaults; an explicit invalid value passes through for the source check to reject.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the optional brief default and why it exists.
 * @evidence contracts/development/implementation.md#efficient-algorithms One property read and one nullish check take constant time.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure accessor coordinates no reusable requests or effectful work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function owns no retained state, descriptor or task.
 */
export function constructionStage(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): ProductionStage {
  return props.construction[layer] ?? "disabled";
}
