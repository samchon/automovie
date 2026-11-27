import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";

/*
 * Selects the narrative layers authored by the declared production route.
 */
export function productionLayers(
  props: IProductionConfigProps,
): readonly AuthoredLayer[] {
  return props.mode === "long"
    ? ["settings", "treatments", "scripts", "screenplay"]
    : props.mode === "short"
      ? ["brief", "screenplay"]
      : [];
}
