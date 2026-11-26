import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSetDesign,
  IAutoMovieMaterializeCompiledInstanceSetInventory,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { materializeCompiledInstanceSet } from "./materializeCompiledInstanceSet";

/**
 * Compile every instance set a world declares into its compact runtime record.
 *
 * Records are keyed by set id and inserted in code-unit order of that id, so
 * the inventory is the same whatever order the world lists its sets in. A world
 * that declares no instance sets compiles to an empty inventory.
 */
export function materializeCompiledInstanceSetInventory(
  props: IAutoMovieMaterializeCompiledInstanceSetInventory.IProps,
): Readonly<Record<string, IAutoMovieCompiledInstanceSet>> {
  return Object.fromEntries(
    [...(props.world.instanceSets ?? [])]
      .sort(
        (
          left: IAutoMovieInstanceSetDesign,
          right: IAutoMovieInstanceSetDesign,
        ): number => AutoMovieEngineText.compareCodeUnits(left.id, right.id),
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
}
