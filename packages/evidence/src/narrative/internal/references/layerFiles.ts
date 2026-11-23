import type { AuthoredLayer } from "../../AuthoredLayer";
import { isCanonLayer } from "../isCanonLayer";

/**
 * Names the layer-scoped documents one layer answers, narrowest last.
 *
 * Placement is decided by who can truthfully answer an item, so the axis is the
 * same wherever it appears: everyone, then the layers that inherit a unit, then
 * the screenplay for realized text, then the exact layer. Shared and local
 * contracts use the same respondent scope.
 */
export function layerFiles(layer: AuthoredLayer): string[] {
  return [
    "common.md",
    ...(isCanonLayer(layer) ? [] : ["narratives.md"]),
    ...(layer === "screenplay" ? ["realized.md"] : []),
    `${layer}.md`,
  ];
}
