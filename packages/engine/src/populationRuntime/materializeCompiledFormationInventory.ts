import {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationDesign,
  IAutoMovieModelRecipe,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { materializeCompiledFormation } from "./materializeCompiledFormation";

/**
 * Compile every formation of a production into its compact runtime record.
 *
 * Records are keyed by formation id and inserted in code-unit order of that id,
 * so the inventory and every artifact that serializes it are the same whatever
 * order the designs were read in. Each formation is compiled against the same
 * recipes, radii and terrain, which is what makes a unit compiled here the unit
 * a shot compiled from the same inputs would hold.
 *
 * @evidence contracts/common.md#principled-implementation Sort formation ids in code-unit order and compile every design against the same recipe, radius and terrain inputs, producing an own-property dictionary independent of author declaration order.
 * @evidence contracts/common.md#clear-and-simple-design Inventory ordering belongs here while the per-formation compiler owns geometry, terrain, summaries and digests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Object.fromEntries admits arbitrary ids as own properties without prototype mutation; no formation id changes compiler policy.
 * @evidence contracts/common.md#meaningful-documentation Docs identify deterministic keyed inventory, caller-supplied measurements and world terrain; each result is a compact formation record.
 * @evidence contracts/performance.md#efficient-algorithms F formations cost O(F log F) ordering plus the sum of their slot/terrain compilation costs and output sizes; no claim of cost independent of member count is made.
 * @evidence contracts/performance.md#reuse-equivalent-work All entries share the same read-only input maps during this call; complete compiled results are not cached across mutable design or measurement inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned dictionary and compiled snapshots; local ordering arrays disappear after completion or failure, with no background work retained.
 */
export const materializeCompiledFormationInventory: (props: {
  /** Formation designs keyed by id. */ formations: ReadonlyMap<
    string,
    IAutoMovieFormationDesign
  >;
  /** Model recipes keyed by id; empty when none are declared. */ recipes?: ReadonlyMap<
    string,
    IAutoMovieModelRecipe
  >;
  /** Supplied root-centered radius estimate in metres keyed by recipe id. */ projectionRadii?: ReadonlyMap<
    string,
    number
  >;
  /** World terrain in declared order; empty when the world has none. */ surfaces?: readonly IAutoMovieWorldSurface[];
}) => Readonly<Record<string, IAutoMovieCompiledFormation>> = (props: {
  /** Formation designs keyed by id. */
  formations: ReadonlyMap<string, IAutoMovieFormationDesign>;
  /** Model recipes keyed by id; empty when none are declared. */
  recipes?: ReadonlyMap<string, IAutoMovieModelRecipe>;
  /** Supplied root-centered radius estimate in metres keyed by recipe id. */
  projectionRadii?: ReadonlyMap<string, number>;
  /** World terrain in declared order; empty when the world has none. */
  surfaces?: readonly IAutoMovieWorldSurface[];
}): Readonly<Record<string, IAutoMovieCompiledFormation>> =>
  Object.fromEntries(
    [...props.formations]
      .sort(
        (
          [left]: [string, IAutoMovieFormationDesign],
          [right]: [string, IAutoMovieFormationDesign],
        ): number => compareCodeUnits(left, right),
      )
      .map(
        ([id, formation]: [string, IAutoMovieFormationDesign]): [
          string,
          IAutoMovieCompiledFormation,
        ] => [
          id,
          materializeCompiledFormation({
            formation,
            recipes: props.recipes,
            projectionRadii: props.projectionRadii,
            surfaces: props.surfaces,
          }),
        ],
      ),
  );
