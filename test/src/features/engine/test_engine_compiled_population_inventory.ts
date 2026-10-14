import {
  materializeCompiledFormation,
  materializeCompiledFormationInventory,
  materializeCompiledInstanceSet,
  materializeCompiledInstanceSetInventory,
  worldRamp,
} from "@automovie/engine";
import {
  type IAutoMovieCompiledFormation,
  type IAutoMovieCompiledInstanceSet,
  IAutoMovieFormationDesign,
  IAutoMovieInstanceSetDesign,
  type IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const unit: (id: string) => IAutoMovieFormationDesign = (
  id: string,
): IAutoMovieFormationDesign => ({
  id,
  modelRecipe: "member",
  count: 4,
  layout: {
    kind: "line",
    files: 2,
    ranks: 2,
    spacing: { lateral: 1, depth: 1 },
  },
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: 1,
  capabilities: [],
  heroOverrides: [],
});

const grove: (id: string) => IAutoMovieInstanceSetDesign = (
  id: string,
): IAutoMovieInstanceSetDesign => ({
  id,
  modelRecipe: "tree",
  count: 3,
  layout: { kind: "grid", rows: 1, columns: 3, spacing: { x: 2, z: 2 } },
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: 1,
  variation: { scale: { min: 1, max: 1 }, palette: ["#00ff00"], traits: [] },
});

const field: IAutoMovieWorldSurface = worldRamp({
  id: "field",
  from: { x: -5, z: -5 },
  to: { x: -5, z: 5 },
  width: 20,
  baseHeight: 0,
  rise: 2,
  walkable: true,
});

/**
 * A production's compiled populations are keyed by id in code-unit order, and
 * selected records match direct kernel calls with the same inputs.
 *
 * For these ASCII ids, code-unit order puts upper-case before lower-case, which is
 * not the order the designs are listed in here, so a key order that merely
 * followed insertion would fail.
 *
 * Scenarios:
 *
 * 1. Formations listed b, B, a are keyed B, a, b, and the selected
 *    B record matches a direct kernel call with radii, terrain and no recipes.
 * 2. Instance sets declared y, X, x are keyed X, x, y, and X matches the direct
 *    instance-set kernel's output for the same world, radii and no recipes.
 * 3. No formations, and a world that declares no instance sets or an empty list,
 *    compile to empty inventories.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls both population inventory compilers with deliberately unsorted ids, checks complete own-key order and selected radius/terrain forwarding, compares full B/X records with direct compiler calls, and checks absent/empty inventory inputs.
 * @evidence contracts/testing.md#independent-expectations Literal B,a,b and X,x,y key sequences independently distinguish code-unit ordering from declaration order; one retained formation surface and authored radii 0.75/two anchor forwarding. Direct-record parity intentionally shares the underlying compiler and does not independently verify its geometry, canonical digest, seed law or omitted recipe behavior.
 * @evidence contracts/testing.md#distinguishing-cases Mixed upper/lower-case ids distinguish order, populated versus absent/empty inputs distinguish no-population behavior, and separately supplied formation terrain and prototype radii distinguish forwarding from default inputs. Only representative B/X full records are compared, while every authored id appears in the key oracle.
 * @evidence contracts/testing.md#execution-ownership Uses synchronous local design/maps/world records and existing numerical comparators, with no renderer, filesystem publication, task, clock or global replacement. Produced dictionaries are caller-owned test values; this case does not exercise prototype-sensitive/integer-like ids, duplicates or production inventory consumers.
 */
export function test_engine_compiled_population_inventory(): void {
  const radii: Map<string, number> = new Map([
    ["member", 0.75],
    ["tree", 2],
  ]);
  const formations: Readonly<Record<string, IAutoMovieCompiledFormation>> =
    materializeCompiledFormationInventory({
      formations: new Map([
        ["b", unit("b")],
        ["B", unit("B")],
        ["a", unit("a")],
      ]),
      projectionRadii: radii,
      surfaces: [field],
    });
  const world: {
    routes: never[];
    instanceSets: IAutoMovieInstanceSetDesign[];
  } = {
    routes: [],
    instanceSets: [grove("y"), grove("X"), grove("x")],
  };
  const instanceSets: Readonly<Record<string, IAutoMovieCompiledInstanceSet>> =
    materializeCompiledInstanceSetInventory({
      world,
      projectionRadii: radii,
    });

  TestValidator.equals(
    "compiled populations are keyed in code-unit order",
    namedFacts([
      [
        "formationKeys",
        (): boolean => Object.keys(formations).join(",") === "B,a,b",
      ],
      [
        "instanceSetKeys",
        (): boolean => Object.keys(instanceSets).join(",") === "X,x,y",
      ],
      [
        "terrainPassedThrough",
        (): boolean => formations.a!.ground.length === 1,
      ],
      [
        "radiiPassedThrough",
        (): boolean =>
          nclose(formations.a!.projectionRadius, 0.75, 0) &&
          nclose(instanceSets.x!.projectionRadius, 2, 0),
      ],
    ]),
    {
      formationKeys: true,
      instanceSetKeys: true,
      terrainPassedThrough: true,
      radiiPassedThrough: true,
    },
  );
  TestValidator.predicate(
    "an inventory formation is the formation kernel's record",
    test12ValuesClose(
      formations.B,
      materializeCompiledFormation({
        formation: unit("B"),
        projectionRadii: radii,
        surfaces: [field],
      }),
    ),
  );
  TestValidator.predicate(
    "an inventory instance set is the instance-set kernel's record",
    test12ValuesClose(
      instanceSets.X,
      materializeCompiledInstanceSet({
        instanceSet: grove("X"),
        world,
        projectionRadii: radii,
      }),
    ),
  );
  TestValidator.equals(
    "no declared population compiles to an empty inventory",
    namedFacts([
      [
        "noFormations",
        (): boolean =>
          Object.keys(
            materializeCompiledFormationInventory({ formations: new Map() }),
          ).length === 0,
      ],
      [
        "noInstanceSetsKey",
        (): boolean =>
          Object.keys(
            materializeCompiledInstanceSetInventory({ world: { routes: [] } }),
          ).length === 0,
      ],
      [
        "emptyInstanceSets",
        (): boolean =>
          Object.keys(
            materializeCompiledInstanceSetInventory({
              world: { routes: [], instanceSets: [] },
            }),
          ).length === 0,
      ],
    ]),
    { noFormations: true, noInstanceSetsKey: true, emptyInstanceSets: true },
  );
}
