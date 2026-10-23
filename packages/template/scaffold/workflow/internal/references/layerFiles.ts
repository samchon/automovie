import type { AuthoredLayer } from "../../AuthoredLayer";
import { REALIZED_LAYERS } from "../REALIZED_LAYERS";

/**
 * Names the layer-scoped documents one layer answers, narrowest last.
 *
 * Placement is decided by who can truthfully answer an item, so the axis is
 * the same wherever it appears: everyone, then the layers that inherit a unit,
 * then the layers holding literal text, then one layer. Both gates and both
 * scopes reuse it, because the question of who can answer does not change with
 * when the answer is owed.
 */
export function layerFiles(layer: AuthoredLayer): string[] {
  return [
    "common.md",
    ...(layer === "settings" ? [] : ["narratives.md"]),
    ...(REALIZED_LAYERS.has(layer) ? ["realized.md"] : []),
    `${layer}.md`,
  ];
}
