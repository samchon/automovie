import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import type { AutoMovieEvidenceProductionStage } from "../AutoMovieEvidenceProductionStage";

/*
 * Reads one layer's construction stage, treating an omitted brief stage as
 * disabled.
 */
export function constructionStage(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): AutoMovieEvidenceProductionStage {
  return props.construction[layer] ?? "disabled";
}
