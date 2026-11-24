import {
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { renderBudgetSubjectFixture } from "../../../internal/renderBudgetSubjectFixture";
import {
  BOX_TRIANGLES,
  modelsFixture,
  sceneFixture,
} from "../../../internal/renderFixtures";

/**
 * An incomplete semantic palette cannot erase a staged node's resource cost.
 *
 * Scenarios:
 *
 * 1. A mask covering only one staged node still attributes the uncovered wall's triangles.
 */
export function test_unit_render_scene_budget_partial_mask(): void {
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;

  const partial: ReturnType<typeof deriveAutoMovieSemanticMask> =
    deriveAutoMovieSemanticMask({
      scene: { ...sceneFixture(), nodes: [sceneFixture().nodes[4]!] },
      models: modelsFixture(),
    });

  TestValidator.equals(
    "a mask that does not cover a staged node still attributes its cost",
    measureAutoMovieRenderInventory({
      subject: subject(),
      mask: partial,
    }).owners.filter(
      (
        entry: ReturnType<
          typeof measureAutoMovieRenderInventory
        >["owners"][number],
      ): boolean =>
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
