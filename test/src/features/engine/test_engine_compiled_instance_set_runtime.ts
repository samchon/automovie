import {
  AUTOMOVIE_INSTANCE_CHUNK_SIZE,
  canonicalizeAutoMovieJson,
  materializeCompiledInstanceSet,
} from "@automovie/engine";
import { summarizeCompiledSlotChunks } from "@automovie/engine/populationRuntime/summarizeCompiledSlotChunks";
import {
  IAutoMovieCompiledFormationLod,
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceChunk,
  IAutoMovieInstanceSetDesign,
  IAutoMovieModel,
  IAutoMovieModelLodRecipe,
  IAutoMovieWorldRoute,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { createModel } from "../internal/createModel";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** One chunk plus one member in a single row, one metre apart along x. */
const row: (
  overrides?: Partial<IAutoMovieInstanceSetDesign>,
) => IAutoMovieInstanceSetDesign = (
  overrides: Partial<IAutoMovieInstanceSetDesign> = {},
): IAutoMovieInstanceSetDesign => ({
  id: "hedge",
  modelRecipe: "tree",
  count: AUTOMOVIE_INSTANCE_CHUNK_SIZE + 1,
  layout: {
    kind: "grid",
    rows: 1,
    columns: AUTOMOVIE_INSTANCE_CHUNK_SIZE + 1,
    spacing: { x: 1, z: 1 },
  },
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: 3,
  variation: { scale: { min: 1, max: 1 }, palette: ["#2f6f2f"], traits: [] },
  ...overrides,
});

const lane: IAutoMovieWorldRoute = {
  id: "lane",
  waypoints: [
    { x: 0, z: 0 },
    { x: 20, z: 0 },
  ],
  allowedFormationWidth: 3,
};

/** The base tree's declared tiers: a hero tier and a near tier of itself. */
const TREE_TIERS: IAutoMovieModelLodRecipe[] = [
  { tier: "hero", maxDistance: 5, recipe: "tree-hero" },
  { tier: "near", maxDistance: 20, recipe: "tree" },
];

/** The shrub prototype's declared tiers: a near tier of itself and a far tier. */
const SHRUB_TIERS: IAutoMovieModelLodRecipe[] = [
  { tier: "near", maxDistance: 10, recipe: "shrub" },
  { tier: "far", maxDistance: null, recipe: "shrub-far" },
];

/** The supplied tree model group, hashed into every tier that names it. */
const models: Map<string, IAutoMovieModel> = new Map<string, IAutoMovieModel>(
  [["tree", { ...createModel(null), id: "tree" }]],
);

const nodeDigest: (value: unknown) => string = (value: unknown): string =>
  `sha256:${createHash("sha256").update(canonicalizeAutoMovieJson(value), "utf8").digest("hex")}`;

/**
 * An instance set compiles to a compact record that keeps its laws, its route
 * snapshot and one resolved prototype table, with repeatable selected digests.
 *
 * Expectations are hand geometry on one row of 1,025 members a metre apart,
 * declared weights and radii, or the Node builder's digest of canonical JSON.
 *
 * Scenarios:
 *
 * 1. One member past a chunk makes two chunks with exact bounds and centroids.
 * 2. Without a prototype table the record names none and takes its radius and
 *    the tiers the set declares for its base group, keeping a declared hero tier
 *    that a formation would drop, because an instance set has no heroes.
 * 3. A table of tall 2 and short 1 compiles with the default first at weight one;
 *    the default keeps the set's tiers, a prototype declaring no tiers draws
 *    through one near tier of its group, a prototype declaring tiers keeps its
 *    own, a supplied group's tier carries its Node digest, each prototype takes
 *    its own radius, and the set's radius is the largest.
 * 4. A route layout snapshots its route as a copy, a local layout records none,
 *    and the laws are copied rather than shared with the design.
 * 5. An unavailable route and a route of no length refuse compilation.
 * 6. The digest is the Node digest of every other field, repeatable, and
 *    different for another seed; omitted tiers, model groups and radii compile
 *    one near tier of the base group at half a metre.
 * 7. Five points are visited once in ascending order, yielding three chunks
 *    with independent centroids and a whole bounds/centroid summary.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs materializeCompiledInstanceSet and the actual shared chunk/global summary seam; asserts compact laws, geometry, prototype/radius policy, refusal and canonical digest, while a callback visit log rejects duplicated slot regeneration.
 * @evidence contracts/testing.md#independent-expectations The authored 1025-point row spans x=-512..512 with first chunk mean -0.5 and final point 512. The five-point callback has positions (s,2s,-s), hence whole mean (2,4,-2) and chunk means (0.5,1,-0.5),(2.5,5,-2.5),(4,8,-4). Literal prototype order/weights and measured/fallback radii anchor policy. Node SHA independently checks hashing, while canonical text is shared and neither fallback enclosure nor every canonicalization decision is independently certified.
 * @evidence contracts/testing.md#distinguishing-cases Covers one past a chunk boundary, prototype default/weights, declared versus undeclared prototype tiers, a supplied versus an absent group digest, present/missing routes, zero-length refusal, copied laws, digest repeat/seed change and explicit missing-radius policy; the odd five-point range distinguishes chunk/global ownership from a second callback traversal. Individual slot variation is owned by the instance-slot tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_engine_compiled_instance_set_runtime owns synchronous local records/maps and a callback visit log supplied through the real summary seam, without foreign-method replacement. Node crypto hashes shared canonical bytes independently; no graphics, publication, clock or production consumer is launched. Copy guards concern these selected route/layout/variation records, not every compiled prototype subtree.
 */
export function test_engine_compiled_instance_set_runtime(): void {
  // 1. Chunks.
  const compiled: IAutoMovieCompiledInstanceSet =
    materializeCompiledInstanceSet({
      instanceSet: row({ lod: TREE_TIERS }),
      world: { routes: [] },
      projectionRadii: new Map([["tree", 1.5]]),
    });
  const [first, last]: IAutoMovieInstanceChunk[] = compiled.chunks;
  TestValidator.equals(
    "one member past a chunk compiles to two exact chunks",
    namedFacts([
      ["two", (): boolean => compiled.chunks.length === 2],
      [
        "firstRange",
        (): boolean => first!.start === 0 && first!.count === 1_024,
      ],
      [
        "firstBounds",
        (): boolean =>
          vclose(first!.bounds.min, { x: -512, y: 0, z: 0 }, 0) &&
          vclose(first!.bounds.max, { x: 511, y: 0, z: 0 }, 0),
      ],
      [
        "firstCentroid",
        (): boolean => vclose(first!.centroid, { x: -0.5, y: 0, z: 0 }, 1e-9),
      ],
      ["lastRange", (): boolean => last!.start === 1_024 && last!.count === 1],
      [
        "lastBounds",
        (): boolean =>
          vclose(last!.bounds.min, { x: 512, y: 0, z: 0 }, 0) &&
          vclose(last!.bounds.max, { x: 512, y: 0, z: 0 }, 0),
      ],
      [
        "lastCentroid",
        (): boolean => vclose(last!.centroid, { x: 512, y: 0, z: 0 }, 0),
      ],
      [
        "totalCentroid",
        (): boolean => vclose(compiled.centroid, { x: 0, y: 0, z: 0 }, 1e-9),
      ],
    ]),
    {
      two: true,
      firstRange: true,
      firstBounds: true,
      firstCentroid: true,
      lastRange: true,
      lastBounds: true,
      lastCentroid: true,
      totalCentroid: true,
    },
  );

  // 2. No table.
  TestValidator.equals(
    "a set without a table keeps its declared base tiers and radius",
    namedFacts([
      [
        "noTable",
        (): boolean => Object.hasOwn(compiled, "prototypes") === false,
      ],
      [
        "tiers",
        (): boolean =>
          compiled.lod
            .map(
              (item: IAutoMovieCompiledFormationLod): "hero" | "near" | "far" =>
                item.tier,
            )
            .join(",") === "hero,near",
      ],
      ["radius", (): boolean => nclose(compiled.projectionRadius, 1.5, 0)],
    ]),
    { noTable: true, tiers: true, radius: true },
  );

  // 3. Table.
  const tabled: IAutoMovieCompiledInstanceSet = materializeCompiledInstanceSet({
    instanceSet: row({
      lod: TREE_TIERS,
      prototypes: [
        { id: "tall", modelRecipe: "tall-tree", weight: 2 },
        { id: "short", modelRecipe: "shrub", weight: 1, lod: SHRUB_TIERS },
      ],
    }),
    world: { routes: [] },
    models,
    projectionRadii: new Map([
      ["tree", 1.5],
      ["tall-tree", 3],
      ["shrub", 0.25],
    ]),
  });
  const [base, tall, short]: IAutoMovieCompiledInstancePrototype[] =
    tabled.prototypes!;
  TestValidator.equals(
    "a declared table compiles with the default first at weight one",
    namedFacts([
      [
        "order",
        (): boolean =>
          tabled
            .prototypes!.map(
              (prototype: IAutoMovieCompiledInstancePrototype): string =>
                prototype.id,
            )
            .join(",") === "default,tall,short",
      ],
      [
        "weights",
        (): boolean =>
          nclose(base!.weight, 1, 0) &&
          nclose(tall!.weight, 2, 0) &&
          nclose(short!.weight, 1, 0),
      ],
      [
        "recipes",
        (): boolean =>
          base!.modelRecipe === "tree" &&
          tall!.modelRecipe === "tall-tree" &&
          short!.modelRecipe === "shrub",
      ],
      [
        "undeclaredDrawsNear",
        (): boolean =>
          tall!.lod.length === 1 &&
          tall!.lod[0]!.tier === "near" &&
          tall!.lod[0]!.recipe === "tall-tree",
      ],
      [
        "declaredTiersKept",
        (): boolean =>
          short!.lod
            .map(
              (item: IAutoMovieCompiledFormationLod): string =>
                `${item.tier}:${item.recipe}`,
            )
            .join(",") === "near:shrub,far:shrub-far",
      ],
      [
        "groupDigest",
        (): boolean =>
          base!.lod[1]!.recipeDigest === nodeDigest(models.get("tree")) &&
          short!.lod[0]!.recipeDigest !== base!.lod[1]!.recipeDigest,
      ],
      [
        "ownRadii",
        (): boolean =>
          nclose(base!.projectionRadius, 1.5, 0) &&
          nclose(tall!.projectionRadius, 3, 0) &&
          nclose(short!.projectionRadius, 0.25, 0),
      ],
      ["largest", (): boolean => nclose(tabled.projectionRadius, 3, 0)],
      [
        "baseTiers",
        (): boolean =>
          tabled.lod
            .map((item: IAutoMovieCompiledFormationLod): string => item.recipe)
            .join(",") === "tree-hero,tree",
      ],
    ]),
    {
      order: true,
      weights: true,
      recipes: true,
      undeclaredDrawsNear: true,
      declaredTiersKept: true,
      groupDigest: true,
      ownRadii: true,
      largest: true,
      baseTiers: true,
    },
  );

  // 4. Route snapshot and copied laws.
  const alongDesign: IAutoMovieInstanceSetDesign = row({
    count: 4,
    layout: { kind: "along-route", route: "lane", lateralJitter: 0.5 },
  });
  const along: IAutoMovieCompiledInstanceSet = materializeCompiledInstanceSet({
    instanceSet: alongDesign,
    world: { routes: [lane] },
  });
  TestValidator.equals(
    "a route layout snapshots its route and the laws are copies",
    namedFacts([
      [
        "snapshot",
        (): boolean =>
          along.route !== null &&
          along.route !== lane &&
          along.route.waypoints !== lane.waypoints &&
          along.route.waypoints.every(
            (point: { x: number; z: number }, index: number): boolean =>
              point !== lane.waypoints[index],
          ) &&
          test12ValuesClose(along.route, lane) &&
          along.route.waypoints.length === 2 &&
          along.route.id === "lane",
      ],
      ["localRecordsNone", (): boolean => compiled.route === null],
      [
        "layoutCopied",
        (): boolean =>
          along.layout !== alongDesign.layout &&
          test12ValuesClose(along.layout, alongDesign.layout) &&
          along.layout.kind === "along-route",
      ],
      [
        "variationCopied",
        (): boolean =>
          along.variation !== alongDesign.variation &&
          along.variation.scale !== alongDesign.variation.scale &&
          along.variation.palette !== alongDesign.variation.palette &&
          along.variation.traits !== alongDesign.variation.traits &&
          test12ValuesClose(along.variation, alongDesign.variation) &&
          along.variation.palette[0] === "#2f6f2f",
      ],
    ]),
    {
      snapshot: true,
      localRecordsNone: true,
      layoutCopied: true,
      variationCopied: true,
    },
  );

  // 5. Refusals.
  TestValidator.equals(
    "an unavailable or zero-length route refuses compilation",
    namedFacts([
      [
        "unavailable",
        (): boolean =>
          throwsError(
            (): IAutoMovieCompiledInstanceSet =>
              materializeCompiledInstanceSet({
                instanceSet: alongDesign,
                world: { routes: [] },
              }),
            'references unavailable route "lane"',
          ),
      ],
      [
        "zeroLength",
        (): boolean =>
          throwsError(
            (): IAutoMovieCompiledInstanceSet =>
              materializeCompiledInstanceSet({
                instanceSet: alongDesign,
                world: {
                  routes: [
                    {
                      ...lane,
                      waypoints: [
                        { x: 5, z: 5 },
                        { x: 5, z: 5 },
                      ],
                    },
                  ],
                },
              }),
            'route "lane" must have finite non-zero length',
          ),
      ],
    ]),
    { unavailable: true, zeroLength: true },
  );

  // 6. Digest and defaults.
  const { digest, ...core }: IAutoMovieCompiledInstanceSet = compiled;
  const bare: IAutoMovieCompiledInstanceSet = materializeCompiledInstanceSet({
    instanceSet: row(),
    world: { routes: [] },
  });
  TestValidator.equals(
    "the digest is the Node digest of the record and defaults compile a bare record",
    namedFacts([
      ["node", (): boolean => digest === nodeDigest(core)],
      [
        "repeatable",
        (): boolean =>
          materializeCompiledInstanceSet({
            instanceSet: row({ lod: TREE_TIERS }),
            world: { routes: [] },
            projectionRadii: new Map([["tree", 1.5]]),
          }).digest === digest,
      ],
      [
        "seed",
        (): boolean =>
          materializeCompiledInstanceSet({
            instanceSet: row({ seed: 4, lod: TREE_TIERS }),
            world: { routes: [] },
            projectionRadii: new Map([["tree", 1.5]]),
          }).digest !== digest,
      ],
      [
        "bareTier",
        (): boolean =>
          bare.lod.length === 1 &&
          bare.lod[0]!.tier === "near" &&
          bare.lod[0]!.recipe === "tree",
      ],
      ["bareRadius", (): boolean => nclose(bare.projectionRadius, 0.5, 0)],
    ]),
    {
      node: true,
      repeatable: true,
      seed: true,
      bareTier: true,
      bareRadius: true,
    },
  );
  const visits: number[] = [];
  const folded: ReturnType<typeof summarizeCompiledSlotChunks> =
    summarizeCompiledSlotChunks(
      5,
      2,
      (slot: number): { x: number; y: number; z: number } => {
        visits.push(slot);
        return { x: slot, y: 2 * slot, z: -slot };
      },
    );
  TestValidator.equals(
    "one actual position evaluation per slot in order",
    visits,
    [0, 1, 2, 3, 4],
  );
  TestValidator.predicate(
    "whole placement-point summary",
    (): boolean =>
      vclose(folded.summary.bounds.min, { x: 0, y: 0, z: -4 }, 0) &&
      vclose(folded.summary.bounds.max, { x: 4, y: 8, z: 0 }, 0) &&
      vclose(folded.summary.centroid, { x: 2, y: 4, z: -2 }, 1e-12),
  );
  TestValidator.predicate(
    "partial final chunk and independent chunk means",
    (): boolean =>
      folded.chunks.length === 3 &&
      folded.chunks[2]!.start === 4 &&
      folded.chunks[2]!.count === 1 &&
      vclose(folded.chunks[0]!.centroid, { x: 0.5, y: 1, z: -0.5 }, 1e-12) &&
      vclose(folded.chunks[1]!.centroid, { x: 2.5, y: 5, z: -2.5 }, 1e-12) &&
      vclose(folded.chunks[2]!.centroid, { x: 4, y: 8, z: -4 }, 1e-12),
  );
}
