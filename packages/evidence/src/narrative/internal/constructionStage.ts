import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import type { ProductionStage } from "../ProductionStage";

/**
 * Reads one layer's construction stage, treating an omitted brief stage as
 * disabled.
 */
export function constructionStage(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): ProductionStage {
  return props.construction[layer] ?? "disabled";
}
