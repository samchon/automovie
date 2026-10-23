import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import { AUTHORED_LAYERS } from "./AUTHORED_LAYERS";

/**
 * Selects the narrative layers authored by the declared production route.
 *
 * @evidence contracts/common.md#principled-implementation The route discriminant chooses all four authored layers for long, screenplay alone for short, and none for asset; validation of route/stage coherence belongs to the factory.
 * @evidence contracts/common.md#clear-and-simple-design This selector centralizes route ownership so claim composition and dependency admission use the same population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Long, short and asset are declared product routes, and no consumer identity changes their layer lists.
 * @evidence contracts/common.md#meaningful-documentation The comment states route-selected authorship; the props contract explains the route and the factory validates it.
 * @evidence contracts/performance.md#efficient-algorithms The route branch and bounded layer array take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work The long route reuses the readonly canonical layer array; the one-element short result has no effectful work or cross-request equivalence requirement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The canonical four-entry array is module-owned; short arrays are caller-owned, and no population grows in retained state or owns handles/tasks.
 */
export function productionLayers(
  props: IProductionConfigProps,
): readonly AuthoredLayer[] {
  return props.mode === "long"
    ? AUTHORED_LAYERS
    : props.mode === "short"
      ? ["screenplay"]
      : [];
}
