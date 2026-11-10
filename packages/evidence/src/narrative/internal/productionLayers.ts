import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";

/**
 * Selects the narrative layers authored by the declared production route.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The route discriminant chooses settings, treatments, scripts and screenplay for long, brief plus screenplay for short, and none for asset; validation of route/stage coherence belongs to the factory.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This selector centralizes route ownership so claim composition and dependency admission use the same population.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Long, short and asset are declared product routes, and no consumer identity changes their layer lists.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states route-selected authorship; the props contract explains the route and the factory validates it.
 * @evidence contracts/development/implementation.md#efficient-algorithms The route branch and bounded layer array take constant time and space.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call returns a fresh bounded literal array; there is no effectful work or cross-request equivalence requirement.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned arrays are caller-owned with at most four entries, and no population grows in retained state or owns handles/tasks.
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
