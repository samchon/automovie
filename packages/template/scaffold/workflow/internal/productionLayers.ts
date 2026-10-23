import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import { AUTHORED_LAYERS } from "./AUTHORED_LAYERS";

/** Selects the narrative layers authored by the declared production route. */
export function productionLayers(
  props: IProductionConfigProps,
): readonly AuthoredLayer[] {
  return props.mode === "long"
    ? AUTHORED_LAYERS
    : props.mode === "short"
      ? ["screenplay"]
      : [];
}
