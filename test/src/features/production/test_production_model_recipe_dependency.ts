import type { IAutoMovieModelRecipe } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const { autoMovieModelRecipeDependsOn } = loadSourceModule<{
  autoMovieModelRecipeDependsOn(
    recipes: ReadonlyMap<string, Pick<IAutoMovieModelRecipe, "lod">>,
    model: string,
    dependency: string,
  ): boolean;
}>(path.resolve(__dirname, "../../../../packages/production/src/production/autoMovieModelRecipeDependsOn.ts"));

/**
 * Mutation consequence follows transitive LOD identity without cycling forever.
 *
 * Scenarios:
 * 1. Exact identity is reflexive, including absent recipes, while empty and
 *    missing nodes have no reachability to another identity.
 * 2. Direct and transitive references affect their dependency; a sibling that
 *    is not reachable stays independent.
 * 3. Self-reference and a multi-node cycle terminate, and exploring a cycle
 *    does not prevent another branch from reaching the requested dependency.
 */
export const test_production_model_recipe_dependency = (): void => {
  const recipe = (...references: string[]): Pick<IAutoMovieModelRecipe, "lod"> => ({
    lod: references.map((reference) => ({ tier: "hero", maxDistance: null, recipe: reference })),
  });
  const recipes = new Map([
    ["ship", recipe("ship", "cycle-a", "near")],
    ["near", recipe("far")], ["far", recipe()],
    ["cycle-a", recipe("cycle-b")], ["cycle-b", recipe("cycle-a")],
    ["self", recipe("self")], ["dangling", recipe("missing")],
  ]);
  const before = [...recipes].map(([id, value]) => ({ id, references: value.lod.map((lod) => lod.recipe) }));
  TestValidator.equals("exact identity is reflexive", autoMovieModelRecipeDependsOn(recipes, "ship", "ship"), true);
  TestValidator.equals("missing exact identity is still reflexive", autoMovieModelRecipeDependsOn(recipes, "missing", "missing"), true);
  TestValidator.equals("missing node cannot reach another identity", autoMovieModelRecipeDependsOn(recipes, "missing", "far"), false);
  TestValidator.equals("empty recipe has no outgoing dependency", autoMovieModelRecipeDependsOn(recipes, "far", "ship"), false);
  TestValidator.equals("direct LOD dependency is visible", autoMovieModelRecipeDependsOn(recipes, "near", "far"), true);
  TestValidator.equals("transitive LOD dependency survives an earlier cyclic branch", autoMovieModelRecipeDependsOn(recipes, "ship", "far"), true);
  TestValidator.equals("unreachable sibling remains independent", autoMovieModelRecipeDependsOn(recipes, "near", "self"), false);
  TestValidator.equals("self-reference cannot reach unrelated identity", autoMovieModelRecipeDependsOn(recipes, "self", "far"), false);
  TestValidator.equals("multi-node cycle cannot invent a dependency", autoMovieModelRecipeDependsOn(recipes, "cycle-a", "far"), false);
  TestValidator.equals("references to absent identities remain dependencies", autoMovieModelRecipeDependsOn(recipes, "dangling", "missing"), true);
  TestValidator.equals("dangling reference has no unrecorded outgoing edge", autoMovieModelRecipeDependsOn(recipes, "dangling", "far"), false);
  TestValidator.equals("analysis cannot alter acquired recipes", [...recipes].map(([id, value]) => ({ id, references: value.lod.map((lod) => lod.recipe) })), before);
};
