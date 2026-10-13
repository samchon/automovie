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
 */
export const test_render_budget_partial_mask = (): void => {
  const subject = renderBudgetSubjectFixture;

  const partial = deriveAutoMovieSemanticMask({
    scene: { ...sceneFixture(), nodes: [sceneFixture().nodes[4]!] },
    models: modelsFixture(),
  });

  TestValidator.equals(
    "a mask that does not cover a staged node still attributes its cost",
    measureAutoMovieRenderInventory({
      subject: subject(),
      mask: partial,
    }).owners.filter(
      (entry) =>
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
};
