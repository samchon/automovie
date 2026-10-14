import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSetDesign,
  IAutoMovieModelRecipe,
  IAutoMovieWorldDesign,
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
 * @evidence contracts/common.md#principled-implementation Sort instance-set ids by code units and compile each against the world route inventory and shared recipe/radius maps; absent world instance sets yield an empty dictionary.
 * @evidence contracts/common.md#clear-and-simple-design This owner provides deterministic inventory order and delegates every placement/digest decision to materializeCompiledInstanceSet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Object.fromEntries preserves arbitrary ids as own keys; no consumer or fixture chooses a different route, prototype or summary law.
 * @evidence contracts/common.md#meaningful-documentation Docs give keyed compact output, optional input inventory meaning and shared host measurement inputs, including approximate radius fallback.
 * @evidence contracts/performance.md#efficient-algorithms I sets cost O(I log I) ordering plus their complete slot/prototype/route compilation work and retained output sizes.
 * @evidence contracts/performance.md#reuse-equivalent-work Recipe and radius maps are borrowed once for all entries; mutable world routes and set laws mean prior compiled results are not reusable merely by id.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the inventory and compact snapshots; local sorted entries and failed partial results are collectable, with no open resource or worker.
 */
export const materializeCompiledInstanceSetInventory: (props: {
  /** World whose instance sets and routes are compiled. */ world: Pick<
    IAutoMovieWorldDesign,
    "instanceSets" | "routes"
  >;
  /** Model recipes keyed by id; empty when none are declared. */ recipes?: ReadonlyMap<
    string,
    IAutoMovieModelRecipe
  >;
  /** Supplied root-centered radius estimate in metres keyed by recipe id. */ projectionRadii?: ReadonlyMap<
    string,
    number
  >;
}) => Readonly<Record<string, IAutoMovieCompiledInstanceSet>> = (props: {
  /** World whose instance sets and routes are compiled. */
  world: Pick<IAutoMovieWorldDesign, "instanceSets" | "routes">;
  /** Model recipes keyed by id; empty when none are declared. */
  recipes?: ReadonlyMap<string, IAutoMovieModelRecipe>;
  /** Supplied root-centered radius estimate in metres keyed by recipe id. */
  projectionRadii?: ReadonlyMap<string, number>;
}): Readonly<Record<string, IAutoMovieCompiledInstanceSet>> =>
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
            recipes: props.recipes,
            projectionRadii: props.projectionRadii,
          }),
        ],
      ),
  );
