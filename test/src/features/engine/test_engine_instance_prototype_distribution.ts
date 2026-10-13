import { materializeCompiledInstanceSet } from "@automovie/engine";
import type { IAutoMovieInstanceSetDesign } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const COUNT = 2_000;
/** Share of members that selected each prototype id. */
const shares = (
  members: ReadonlyArray<{ prototype?: string }>,
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const member of members) {
    const id = member.prototype ?? "(none)";
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).map(([id, count]) => [id, count / members.length]),
  );
};


/**
 * A two-thousand-member weighted table accounts for the default once through both direct and compiled instance regeneration. Proportions and recipe ownership keep the original statistical bounds.
 *
 * Scenarios:
 * 1. Default/tall/short weights 1/2/1 produce 25/50/25 percent within four points.
 * 2. Compilation prepends the default once and retains the same population and law.
 */
export const test_engine_instance_prototype_distribution = (): void => {
  const omitted = shares([{}, { prototype: "declared" }]);
  TestValidator.predicate("the share observer accounts for both declared and absent prototype fields", nclose(omitted["(none)"]!, .5) && nclose(omitted.declared!, .5));
  // 3. Weighted table with the default first.
  const table = crowd({
    prototypes: [
      { id: "default", modelRecipe: "body", weight: 1 },
      { id: "tall", modelRecipe: "tall-body", weight: 2 },
      { id: "short", modelRecipe: "short-body", weight: 1 },
    ],
  });
  const chosen = slots(table);
  const tableShares = shares(chosen);
  const recipeOf: Record<string, string> = {
    default: "body",
    tall: "tall-body",
    short: "short-body",
  };
  TestValidator.equals(
    "a weighted table is chosen in proportion to its weights",
    namedFacts([
      ["default", () => Math.abs(tableShares.default! - 0.25) < 0.04],
      ["tall", () => Math.abs(tableShares.tall! - 0.5) < 0.04],
      ["short", () => Math.abs(tableShares.short! - 0.25) < 0.04],
      [
        "recipeFollowsPrototype",
        () =>
          chosen.every(
            (member) => member.modelRecipe === recipeOf[member.prototype!],
          ),
      ],
    ]),
    { default: true, tall: true, short: true, recipeFollowsPrototype: true },
  );


  // 4. The same table from a design compiles the default in once.
  const design: IAutoMovieInstanceSetDesign = {
    id: "crowd",
    modelRecipe: "body",
    prototypes: [
      { id: "tall", modelRecipe: "tall-body", weight: 2 },
      { id: "short", modelRecipe: "short-body", weight: 1 },
    ],
    count: COUNT,
    layout: { kind: "grid", rows: 50, columns: 40, spacing: { x: 1, z: 1 } },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 12_345,
    variation: crowd().variation,
  };
  const compiled = materializeCompiledInstanceSet({
    instanceSet: design,
    world: { routes: [] },
  });
  const compiledShares = shares(slots(compiled));
  TestValidator.equals(
    "a compiled table regenerates with the default counted once",
    namedFacts([
      [
        "table",
        () =>
          compiled.prototypes!.map((prototype) => prototype.id).join(",") ===
          "default,tall,short",
      ],
      ["default", () => Math.abs(compiledShares.default! - 0.25) < 0.04],
      ["tall", () => Math.abs(compiledShares.tall! - 0.5) < 0.04],
      ["short", () => Math.abs(compiledShares.short! - 0.25) < 0.04],
    ]),
    { table: true, default: true, tall: true, short: true },
  );


};
