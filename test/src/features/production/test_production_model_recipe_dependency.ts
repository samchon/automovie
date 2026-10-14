import type { IAutoMovieModelRecipe } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";


import { autoMovieModelRecipeDependsOn } from "../../../../packages/production/src/production/autoMovieModelRecipeDependsOn";

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
 * 4. A deep chain and a shared DAG remain searchable without recursion failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual mutation LOD reachability owner and asserts reflexive, transitive, absent, cyclic and deep graph answers without mutating recipes, catching native recursion failure while retaining exact dependency semantics.
 * @evidence contracts/testing.md#independent-expectations Literal edge lists determine reachability: missing nodes have no outgoing edges, identity is reflexive and a chain's terminal identity is reachable while an unrelated identity is not; expected answers do not invoke another traversal implementation.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts exact/missing/empty identities, direct and transitive edges, unrelated siblings, self and multi-node cycles, dangling references, a deep chain and a shared DAG; design admission separately owns malformed recipe fields and runtime geometry.
 * @evidence contracts/testing.md#execution-ownership The exported portable unit imports production reachability directly and uses caller-owned typed maps, starting no process/native artifact or host and dynamically registering no cases.
 */
export function test_production_model_recipe_dependency(): void {
  function recipe(
    ...references: string[]
  ): Pick<IAutoMovieModelRecipe, "lod"> {
    return {
    lod: references.map((reference: string): IAutoMovieModelRecipe["lod"][number] => ({
      tier: "hero",
      maxDistance: null,
      recipe: reference,
    })),
    };
  }
  const recipes: Map<string, Pick<IAutoMovieModelRecipe, "lod">> = new Map([
    ["ship", recipe("ship", "cycle-a", "near")],
    ["near", recipe("far")],
    ["far", recipe()],
    ["cycle-a", recipe("cycle-b")],
    ["cycle-b", recipe("cycle-a")],
    ["self", recipe("self")],
    ["dangling", recipe("missing")],
  ]);
  const before: Array<{ id: string; references: string[] }> = [...recipes].map(([id, value]: [string, Pick<IAutoMovieModelRecipe, "lod">]): { id: string; references: string[] } => ({
    id,
    references: value.lod.map((lod: IAutoMovieModelRecipe["lod"][number]): string => lod.recipe),
  }));
  TestValidator.equals(
    "exact identity is reflexive",
    autoMovieModelRecipeDependsOn(recipes, "ship", "ship"),
    true,
  );
  TestValidator.equals(
    "missing exact identity is still reflexive",
    autoMovieModelRecipeDependsOn(recipes, "missing", "missing"),
    true,
  );
  TestValidator.equals(
    "missing node cannot reach another identity",
    autoMovieModelRecipeDependsOn(recipes, "missing", "far"),
    false,
  );
  TestValidator.equals(
    "empty recipe has no outgoing dependency",
    autoMovieModelRecipeDependsOn(recipes, "far", "ship"),
    false,
  );
  TestValidator.equals(
    "direct LOD dependency is visible",
    autoMovieModelRecipeDependsOn(recipes, "near", "far"),
    true,
  );
  TestValidator.equals(
    "transitive LOD dependency survives an earlier cyclic branch",
    autoMovieModelRecipeDependsOn(recipes, "ship", "far"),
    true,
  );
  TestValidator.equals(
    "unreachable sibling remains independent",
    autoMovieModelRecipeDependsOn(recipes, "near", "self"),
    false,
  );
  TestValidator.equals(
    "self-reference cannot reach unrelated identity",
    autoMovieModelRecipeDependsOn(recipes, "self", "far"),
    false,
  );
  TestValidator.equals(
    "multi-node cycle cannot invent a dependency",
    autoMovieModelRecipeDependsOn(recipes, "cycle-a", "far"),
    false,
  );
  TestValidator.equals(
    "references to absent identities remain dependencies",
    autoMovieModelRecipeDependsOn(recipes, "dangling", "missing"),
    true,
  );
  TestValidator.equals(
    "dangling reference has no unrecorded outgoing edge",
    autoMovieModelRecipeDependsOn(recipes, "dangling", "far"),
    false,
  );
  TestValidator.equals(
    "analysis cannot alter acquired recipes",
    [...recipes].map(([id, value]: [string, Pick<IAutoMovieModelRecipe, "lod">]): { id: string; references: string[] } => ({
      id,
      references: value.lod.map((lod: IAutoMovieModelRecipe["lod"][number]): string => lod.recipe),
    })),
    before,
  );
  const depth: number = 8_192;
  const deep: Map<string, Pick<IAutoMovieModelRecipe, "lod">> = new Map();
  for (let index: number = 0; index < depth; ++index)
    deep.set(`node-${index}`, recipe(`node-${index + 1}`));
  TestValidator.equals("deep chain reaches its dangling terminal", autoMovieModelRecipeDependsOn(deep, "node-0", `node-${depth}`), true);
  TestValidator.equals("deep chain cannot invent unrelated reachability", autoMovieModelRecipeDependsOn(deep, "node-0", "outside"), false);
  const shared: Map<string, Pick<IAutoMovieModelRecipe, "lod">> = new Map([
    ["root", recipe("left", "right")],
    ["left", recipe("join")], ["right", recipe("join")],
    ["join", recipe("root", "target")],
  ]);
  TestValidator.equals("shared DAG cycle reaches its real dependency", autoMovieModelRecipeDependsOn(shared, "root", "target"), true);
  TestValidator.equals("shared DAG cycle does not reach another identity", autoMovieModelRecipeDependsOn(shared, "root", "outside"), false);
}
