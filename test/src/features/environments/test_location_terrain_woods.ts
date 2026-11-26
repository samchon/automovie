import {
  createEnvironment,
  createTerrain,
} from "@automovie/archetypes/environments";
import { surfaceHeightAt, AutoMovieEnginePopulationRuntime } from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieExplicitInstanceTransform,
  IAutoMovieHeightRule,
  IAutoMovieInstancePrototypeDesign,
  IAutoMovieInstanceSetDesign,
  IAutoMovieModel,
  IAutoMovieTerrainRecipe,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** The terrain's placement: world X, Y and Z of its local origin. */
const ORIGIN: { x: number; y: number; z: number } = { x: -5, y: 1, z: 2 };

/** The 30 m by 20 m wood of every scenario, in local plan metres. */
const OUTLINE: readonly IAutoMovieTerrainRecipe.Point[] = [
  [5, 5],
  [35, 5],
  [35, 25],
  [5, 25],
];

/** The 2 m path across the wood along local z = 15. */
const PATH: IAutoMovieTerrainRecipe.IPath = {
  points: [
    [2, 15],
    [38, 15],
  ],
  width: 2,
};

/**
 * A wood planted over an outline keeps its trunks apart, clears only the trees
 * a path touches, mixes species by weight and stands every tree on the ground.
 *
 * Scenarios:
 *
 * 1. A 30 m by 20 m outline with `spacing: 4` and a 2 m path across it plants
 *    trees; every pair of trunks is at least 4 m apart within 1e-9 m, and no
 *    trunk disk reaches the path corridor.
 * 2. The same recipe without the path plants more trees, and every tree the path
 *    leaves stands at the same site without it, so only touched sites go.
 * 3. `species: { whiteOak: 1, douglasFir: 1 }` yields both prototypes, and each
 *    transform names one of them.
 * 4. A `count` above the accepted sites is refused naming how many fit; a smaller
 *    count keeps the first sites of the full planting in order.
 * 5. The same seed gives byte-identical instance sets; another seed moves at least
 *    one site.
 * 6. Every regenerated tree's world Y equals `surfaceHeightAt` of the terrain rule
 *    at its XZ, on noise relief.
 * 7. A zero spacing, an unknown species and an outline reaching the parcel edge
 *    are refused, each naming the wood.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds environments through the public `createTerrain` and `createEnvironment` entry and reads the emitted instance set, its prototype models and the engine's own slot regeneration, which catches trunks closer than the spacing, a path that refuses the wood or leaves a trunk on it, a single-species set, a silent count overflow, an unseeded or nondeterministic layout and trees off the ground.
 * @evidence contracts/development/testing.md#independent-expectations The 4 m spacing, the corridor's 1 m half width and the trunk radius read from the prototype's own trunk cylinder come from the recipe and the drawn model; heights come from the terrain rule through the engine's `surfaceHeightAt`, not from the woods module.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs the wood with and without its path, one and two species, a count above and below the accepted number, two seeds, and three malformed recipes; `test_location_terrain` and `test_environment_production` keep the tree disks' own cases.
 * @evidence contracts/development/testing.md#execution-ownership A CPU-only feature scenario over in-memory recipes; it starts no renderer or host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists its seven scenarios with the input and expected behavior of each.
 */
export function test_location_terrain_woods(): void {
  const build: (
    seed: number,
    woods?: Partial<IAutoMovieTerrainRecipe.IWoods>,
    path?: boolean,
  ) => IAutoMovieEnvironment = (
    seed: number,
    woods: Partial<IAutoMovieTerrainRecipe.IWoods> = {},
    path: boolean = true,
  ): IAutoMovieEnvironment =>
    createEnvironment({
      id: "forest",
      seed,
      items: {
        land: {
          at: ORIGIN,
          use: createTerrain({
            size: [40, 30],
            relief: { kind: "noise", amplitude: 1, wavelength: 30, octaves: 2 },
            ...(path ? { paths: { trail: PATH } } : {}),
            woods: { stand: { outline: OUTLINE, spacing: 4, ...woods } },
          }),
        },
      },
    });
  const woodsOf: (
    environment: IAutoMovieEnvironment,
  ) => IAutoMovieInstanceSetDesign = (
    environment: IAutoMovieEnvironment,
  ): IAutoMovieInstanceSetDesign =>
    environment.runtime.world.instanceSets!.find(
      (set: IAutoMovieInstanceSetDesign): boolean =>
        set.id === "forest/land/woods/stand",
    )!;
  const transformsOf: (
    environment: IAutoMovieEnvironment,
  ) => readonly IAutoMovieExplicitInstanceTransform[] = (
    environment: IAutoMovieEnvironment,
  ): readonly IAutoMovieExplicitInstanceTransform[] => {
    const layout: IAutoMovieInstanceSetDesign["layout"] =
      woodsOf(environment).layout;
    return layout.kind === "explicit" ? layout.transforms : [];
  };

  // The largest drawn trunk radius among a set's prototype models.
  const trunkOf: (environment: IAutoMovieEnvironment) => number = (
    environment: IAutoMovieEnvironment,
  ): number =>
    Math.max(
      ...woodsOf(environment).prototypes!.map(
        (prototype: IAutoMovieInstancePrototypeDesign): number => {
          const model: IAutoMovieModel = environment.runtime.models.find(
            (candidate: IAutoMovieModel): boolean =>
              candidate.id === prototype.model,
          )!;
          const trunk: IAutoMovieModel["parts"][number] = model.parts.find(
            (part: IAutoMovieModel["parts"][number]): boolean =>
              part.id.endsWith("trunk"),
          )!;
          return trunk.geometry.type === "primitive" &&
            trunk.geometry.shape.type === "cylinder"
            ? trunk.geometry.shape.radius
            : NaN;
        },
      ),
    );

  const trail: IAutoMovieEnvironment = build(1);
  const planted: readonly IAutoMovieExplicitInstanceTransform[] =
    transformsOf(trail);
  const trunk: number = trunkOf(trail);
  const clear: IAutoMovieEnvironment = build(1, {}, false);
  const open: readonly IAutoMovieExplicitInstanceTransform[] =
    transformsOf(clear);
  const mixed: IAutoMovieEnvironment = build(1, {
    species: { whiteOak: 1, douglasFir: 1 },
  });
  const rule: IAutoMovieHeightRule = trail.stage.space!.surfaces[0]!.height!;
  const anchor: IAutoMovieInstanceSetDesign["anchor"] = woodsOf(trail).anchor;
  const compiled: ReturnType<typeof AutoMovieEnginePopulationRuntime.materializeCompiledInstanceSetInventory> =
    AutoMovieEnginePopulationRuntime.materializeCompiledInstanceSetInventory({ world: trail.runtime.world });
  const facts: Record<string, boolean> = namedFacts([
    [
      "the wood plants trees with every trunk pair at least the spacing apart",
      (): boolean =>
        planted.length > 0 &&
        trunk > 0 &&
        planted.every(
          (a: IAutoMovieExplicitInstanceTransform, i: number): boolean =>
            planted
              .slice(i + 1)
              .every(
                (b: IAutoMovieExplicitInstanceTransform): boolean =>
                  Math.hypot(
                    a.translation.x - b.translation.x,
                    a.translation.z - b.translation.z,
                  ) >=
                  4 - 1e-9,
              ),
        ),
    ],
    [
      "no trunk disk reaches the path corridor",
      (): boolean =>
        planted.every(
          (t: IAutoMovieExplicitInstanceTransform): boolean =>
            Math.abs(t.translation.z - 15) > PATH.width / 2 + trunk,
        ),
    ],
    [
      "without the path more trees stand, and every path-side tree keeps its site",
      (): boolean =>
        open.length > planted.length &&
        planted.every((t: IAutoMovieExplicitInstanceTransform): boolean =>
          open.some(
            (u: IAutoMovieExplicitInstanceTransform): boolean =>
              u.id === t.id &&
              u.translation.x === t.translation.x &&
              u.translation.z === t.translation.z,
          ),
        ),
    ],
    [
      "two weighted species give both prototypes, and each tree names one",
      (): boolean => {
        const kinds: string[] = (woodsOf(mixed).prototypes ?? []).map(
          (prototype: IAutoMovieInstancePrototypeDesign): string =>
            prototype.id,
        );
        const named: Set<string | undefined> = new Set(
          transformsOf(mixed).map(
            (t: IAutoMovieExplicitInstanceTransform): string | undefined =>
              t.prototype,
          ),
        );
        return (
          kinds.join() === "whiteOak,douglasFir" &&
          named.size === 2 &&
          named.has("whiteOak") &&
          named.has("douglasFir")
        );
      },
    ],
    [
      "a count above the accepted sites is refused naming how many fit",
      (): boolean =>
        throwsError(
          (): IAutoMovieEnvironment => build(1, { count: planted.length + 1 }),
          ["forest/land/woods/stand", `${planted.length} sites fit`],
        ),
    ],
    [
      "a smaller count keeps the first sites of the full planting",
      (): boolean => {
        const few: readonly IAutoMovieExplicitInstanceTransform[] =
          transformsOf(build(1, { count: 3 }));
        return (
          few.length === 3 &&
          JSON.stringify(few) === JSON.stringify(planted.slice(0, 3))
        );
      },
    ],
    [
      "the same seed repeats the set byte for byte, and another seed moves a site",
      (): boolean => {
        const again: IAutoMovieEnvironment = build(1);
        const other: readonly IAutoMovieExplicitInstanceTransform[] =
          transformsOf(build(2));
        return (
          JSON.stringify(again.runtime.world.instanceSets) ===
            JSON.stringify(trail.runtime.world.instanceSets) &&
          JSON.stringify(again.runtime.models) ===
            JSON.stringify(trail.runtime.models) &&
          (other.length !== planted.length ||
            other.some(
              (t: IAutoMovieExplicitInstanceTransform, i: number): boolean =>
                t.translation.x !== planted[i]!.translation.x ||
                t.translation.z !== planted[i]!.translation.z,
            ))
        );
      },
    ],
    [
      "every regenerated tree stands at the terrain rule's height at its XZ",
      (): boolean =>
        anchor.y === 0 &&
        planted.every(
          (t: IAutoMovieExplicitInstanceTransform, slot: number): boolean => {
            const position: { x: number; y: number; z: number } = AutoMovieEnginePopulationRuntime.instanceSlot(
              compiled["forest/land/woods/stand"]!,
              slot,
            ).position;
            return (
              nclose(
                t.translation.y,
                surfaceHeightAt(
                  { height: rule },
                  anchor.x + t.translation.x,
                  anchor.z + t.translation.z,
                ),
                1e-12,
              ) &&
              nclose(
                position.y,
                surfaceHeightAt({ height: rule }, position.x, position.z),
                1e-12,
              )
            );
          },
        ),
    ],
    [
      "the noise relief puts trees at more than one height",
      (): boolean =>
        new Set(
          planted.map(
            (t: IAutoMovieExplicitInstanceTransform): number => t.translation.y,
          ),
        ).size > 1,
    ],
    [
      "a zero spacing, an unknown species and an edge outline are refused by name",
      (): boolean =>
        throwsError(
          (): IAutoMovieEnvironment => build(1, { spacing: 0 }),
          ["forest/land/woods/stand", "spacing"],
        ) &&
        throwsError(
          (): IAutoMovieEnvironment =>
            build(1, {
              species: { whiteOak: 1, beech: 1 } as Partial<
                Record<"whiteOak" | "douglasFir", number>
              >,
            }),
          ["forest/land/woods/stand", "weights"],
        ) &&
        throwsError(
          (): IAutoMovieEnvironment =>
            build(1, {
              outline: [
                [0, 5],
                [35, 5],
                [35, 25],
                [0, 25],
              ],
            }),
          ["forest/land/woods/stand", "strictly inside the parcel"],
        ),
    ],
  ]);
  TestValidator.predicate(
    `terrain woods: ${Object.entries(facts)
      .filter(([, ok]: [string, boolean]): boolean => !ok)
      .map(([name]: [string, boolean]): string => name)
      .join("; ")}`,
    Object.values(facts).every((ok: boolean): boolean => ok) &&
      Object.keys(facts).length === 10,
  );
}
