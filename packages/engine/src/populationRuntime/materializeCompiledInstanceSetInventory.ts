import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSetDesign,
  IAutoMovieMaterializeCompiledInstanceSetInventory,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { materializeCompiledInstanceSet } from "./materializeCompiledInstanceSet";

/**
 * Compile every instance set a world declares into its compact runtime record.
 *
 * Records are keyed by set id and inserted in code-unit order of that id, so
 * the inventory is the same whatever order the world lists its sets in. A
 * world that declares no instance sets compiles to an empty inventory.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Sort instance-set ids by code units and compile each against the world route inventory and shared model group/radius maps; absent world instance sets yield an empty dictionary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner provides deterministic inventory order and delegates every placement/digest decision to materializeCompiledInstanceSet.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Object.fromEntries preserves arbitrary ids as own keys; no consumer or fixture chooses a different route, prototype or summary law.
 * @evidence contracts/development/common.md#meaningful-documentation Docs give keyed compact output, optional input inventory meaning and shared host measurement inputs, including approximate radius fallback.
 * @evidence contracts/development/implementation.md#efficient-algorithms I sets cost O(I log I) ordering plus their complete slot/prototype/route compilation work and retained output sizes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Model group and radius maps are borrowed once for all entries; mutable world routes and set laws mean prior compiled results are not reusable merely by id.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller receives the inventory and compact snapshots; local sorted entries and failed partial results are collectable, with no open resource or worker.
 */
export const materializeCompiledInstanceSetInventory: (
  props: IAutoMovieMaterializeCompiledInstanceSetInventory.IProps,
) => Readonly<Record<string, IAutoMovieCompiledInstanceSet>> = (
  props: IAutoMovieMaterializeCompiledInstanceSetInventory.IProps,
): Readonly<Record<string, IAutoMovieCompiledInstanceSet>> =>
  Object.fromEntries(
    [...(props.world.instanceSets ?? [])]
      .sort(
        (
          left: IAutoMovieInstanceSetDesign,
          right: IAutoMovieInstanceSetDesign,
        ): number => compareCodeUnits(left.id, right.id),
      )
      .map(
        (
          instanceSet: IAutoMovieInstanceSetDesign,
        ): [string, IAutoMovieCompiledInstanceSet] => [
          instanceSet.id,
          materializeCompiledInstanceSet({
            instanceSet,
            world: props.world,
            models: props.models,
            projectionRadii: props.projectionRadii,
          }),
        ],
      ),
  );
