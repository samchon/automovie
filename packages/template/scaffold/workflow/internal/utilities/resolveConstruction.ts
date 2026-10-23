import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionConstructionStageMixin } from "../../ProductionConstructionStageMixin";

/**
 * Normalizes a construction stage and its screenplay scripts-source flag.
 *
 * A bare stage selects scripts naturalness when used for screenplay. Other layers
 * ignore the source flag and require their documentary parent's construction.
 * Both source choices read the current body.
 */
export function resolveConstruction(
  construction: IProductionConfigProps["construction"][AuthoredLayer],
): ProductionConstructionStageMixin {
  return typeof construction === "string" ? [construction, true] : construction;
}
