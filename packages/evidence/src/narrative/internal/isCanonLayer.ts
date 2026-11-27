import type { AuthoredLayer } from "../AuthoredLayer";

/*
 * Reports whether a layer is canon, long-route settings or short-route brief,
 * which inherits no parent layer.
 */
export function isCanonLayer(
  layer: AuthoredLayer,
): layer is "settings" | "brief" {
  return layer === "settings" || layer === "brief";
}
