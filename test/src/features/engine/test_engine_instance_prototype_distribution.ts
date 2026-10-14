import { materializeCompiledInstanceSet } from "@automovie/engine";
import type { IAutoMovieInstanceSetDesign } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";
import { namedFacts, nclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";

const COUNT: number = 2_000;
/** Share of members that selected each prototype id. */
const shares: (
  members: ReadonlyArray<{ prototype?: string }>,
) => Record<string, number> = (
  members: ReadonlyArray<{ prototype?: string }>,
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const member of members) {
    const id: string = member.prototype ?? "(none)";
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).map(
      ([id, count]: [string, number]): [string, number] => [
        id,
        count / members.length,
      ],
    ),
  );
};

/**
 * A two-thousand-member weighted table accounts for the default once through both direct and compiled instance regeneration. Proportions and recipe ownership keep the original statistical bounds.
 *
 * Scenarios:
 * 1. Default/tall/short weights 1/2/1 produce 25/50/25 percent within four points.
 * 2. Compilation prepends the default once and retains the same population and law.
 *
 * @evidence contracts/testing.md#behavioral-verification Regenerates all 2000 addressed slots through the actual member owner and repeats through actual compiled instance materialization, observing weighted prototype shares, recipe linkage and one default entry.
 * @evidence contracts/testing.md#independent-expectations Literal weights 1/2/1 imply shares .25/.5/.25, each under the original strict four-percentage-point bound. This is one fixed-seed population witness rather than an exhaustive probability or independence proof; the share counter only summarizes observed choices.
 * @evidence contracts/testing.md#distinguishing-cases Compares direct default-first placement with a design that lists only two nondefault prototypes, preserving every slot and recipe association. Zero/invalid weights and explicit prototype selection belong to their dedicated admission/selection units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns local placements, compiled records and arrays via existing canonical fixtures; it opens no file, renderer, browser or GPU and replaces no foreign method or installed consumer.
 */
export function test_engine_instance_prototype_distribution(): void {
  // 3. Weighted table with the default first.
  const table: ReturnType<typeof crowd> = crowd({
    prototypes: [
      { id: "default", modelRecipe: "body", weight: 1 },
      { id: "tall", modelRecipe: "tall-body", weight: 2 },
      { id: "short", modelRecipe: "short-body", weight: 1 },
    ],
  });
  const chosen: ReturnType<typeof slots> = slots(table);
  const tableShares: ReturnType<typeof shares> = shares(chosen);
  const recipeOf: Record<string, string> = {
    default: "body",
    tall: "tall-body",
    short: "short-body",
  };
  TestValidator.equals(
    "a weighted table is chosen in proportion to its weights",
    namedFacts([
      [
        "default",
        (): boolean =>
          nclose(tableShares.default!, 0.25, 0.04) &&
          Math.abs(tableShares.default! - 0.25) < 0.04,
      ],
      [
        "tall",
        (): boolean =>
          nclose(tableShares.tall!, 0.5, 0.04) &&
          Math.abs(tableShares.tall! - 0.5) < 0.04,
      ],
      [
        "short",
        (): boolean =>
          nclose(tableShares.short!, 0.25, 0.04) &&
          Math.abs(tableShares.short! - 0.25) < 0.04,
      ],
      [
        "recipeFollowsPrototype",
        (): boolean =>
          chosen.every(
            (member: (typeof chosen)[number]): boolean =>
              member.modelRecipe === recipeOf[member.prototype!],
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
  const compiled: ReturnType<typeof materializeCompiledInstanceSet> =
    materializeCompiledInstanceSet({
      instanceSet: design,
      world: { routes: [] },
    });
  const compiledShares: ReturnType<typeof shares> = shares(slots(compiled));
  TestValidator.equals(
    "a compiled table regenerates with the default counted once",
    namedFacts([
      [
        "table",
        (): boolean =>
          compiled
            .prototypes!.map(
              (
                prototype: NonNullable<typeof compiled.prototypes>[number],
              ): string => prototype.id,
            )
            .join(",") === "default,tall,short",
      ],
      [
        "default",
        (): boolean =>
          nclose(compiledShares.default!, 0.25, 0.04) &&
          Math.abs(compiledShares.default! - 0.25) < 0.04,
      ],
      [
        "tall",
        (): boolean =>
          nclose(compiledShares.tall!, 0.5, 0.04) &&
          Math.abs(compiledShares.tall! - 0.5) < 0.04,
      ],
      [
        "short",
        (): boolean =>
          nclose(compiledShares.short!, 0.25, 0.04) &&
          Math.abs(compiledShares.short! - 0.25) < 0.04,
      ],
    ]),
    { table: true, default: true, tall: true, short: true },
  );
}
