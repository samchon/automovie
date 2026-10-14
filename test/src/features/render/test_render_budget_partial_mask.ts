import { deriveAutoMovieSemanticMask, measureAutoMovieRenderInventory } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { BOX_TRIANGLES, modelsFixture, sceneFixture } from "../internal/renderFixtures";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";

/**
 * An incomplete semantic palette cannot erase a staged node's resource cost.
 *
 * Scenarios:
 *
 * 1. A mask covering only one staged node still attributes the uncovered wall's triangles.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives a real semantic mask covering only the fixture's fifth node, then measures the full subject and requires the uncovered hall-wall's exact own triangle attribution. Palette omission cannot erase measured resource cost.
 * @evidence contracts/testing.md#independent-expectations The fixture wall uses the authored box primitive with BOX_TRIANGLES triangles and its declared node/source address. The expected singleton owner row is hand-authored rather than copied from the partial mask or measured inventory.
 * @evidence contracts/testing.md#distinguishing-cases Keeps a covered node next to an uncovered staged wall and checks the uncovered wall's complete metric/owner/source/kind/cost row. Fully classified and missing-resource measurements belong to report and incomplete-resource tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_partial_mask owns the portable mask-derivation/inventory case; it creates no GPU mask, render frame, browser or host process.
 */
export function test_render_budget_partial_mask(): void {
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;

  const partial: ReturnType<typeof deriveAutoMovieSemanticMask> = deriveAutoMovieSemanticMask({
    scene: { ...sceneFixture(), nodes: [sceneFixture().nodes[4]!] },
    models: modelsFixture(),
  });

  TestValidator.equals(
    "a mask that does not cover a staged node still attributes its cost",
    measureAutoMovieRenderInventory({
      subject: subject(),
      mask: partial,
    }).owners.filter(
      (entry: ReturnType<typeof measureAutoMovieRenderInventory>["owners"][number]): boolean =>
        entry.metric === "triangles" && entry.owner.includes("hall-wall"),
    ),
    [
      {
        owner: "node:tower/hall-wall",
        source: 'scene.nodes["tower/hall-wall"]',
        metric: "triangles",
        cost: BOX_TRIANGLES,
        kind: "own",
      },
    ],
  );
}
