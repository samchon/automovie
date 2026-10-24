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
 *
 * @evidence contracts/common.md#principled-implementation The fixed candidate order is common, optional inherited-narrative, optional literal-text and exact layer, matching the respondent populations declared by the four-layer pipeline.
 * @evidence contracts/common.md#clear-and-simple-design One shared axis serves discovery/principle/obligation selection without duplicating layer eligibility decisions across gates or language scopes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Settings omits inherited narrative duties and only REALIZED_LAYERS receives literal-text duties, both explicit semantic differences of the supported pipeline.
 * @evidence contracts/common.md#meaningful-documentation The prose explains narrowest-last order and why eligibility depends on the respondent rather than gate timing.
 * @evidence contracts/performance.md#efficient-algorithms At most four filenames and one constant-time Set membership check are produced, giving constant work and space independent of manuscript length.
 * @evidence contracts/performance.md#reuse-equivalent-work REALIZED_LAYERS is the shared eligibility set, while the returned array is fresh so filtering or mutation by one family cannot alter another family selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The at-most-four-element result is caller-owned and no cache or resource handle is retained.
 */
export function layerFiles(layer: AuthoredLayer): string[] {
  return [
    "common.md",
    ...(layer === "settings" ? [] : ["narratives.md"]),
    ...(REALIZED_LAYERS.has(layer) ? ["realized.md"] : []),
    `${layer}.md`,
  ];
}
