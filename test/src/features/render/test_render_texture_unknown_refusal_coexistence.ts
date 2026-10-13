import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";

/**
 * Over-limit recovery never suppresses an independent required native texture
 * uncertainty. Normal render evidence retains both owning diagnostics.
 *
 * Scenarios:
 *
 * 1. Supported, over-only and unknown-only shots retain their existing outcomes.
 * 2. One shot that is both over and unknown reports both conditions.
 * 3. Separate over and unknown shots keep each shot/asset identity in one refusal.
 */
export const test_render_texture_unknown_refusal_coexistence = (): void => {
  const model = boxModel({ id: "model", materials: [material("surface", "image")] });
  const scene = { ...sceneFixture(), lights: [], nodes: [{ ...sceneFixture().nodes[0], model: model.id }] };
  const compiled = compiledShotFixture({ models: [model], scene });
  const assess = (shot: string, over: boolean, known: boolean) => assessAutoMovieRenderBudget({
    compiled, shot, budget: over ? { version: 1, tier: "unit", limits: { triangles: 0 } } : null,
    renderer: { api: "webgl2", vendor: "typed-unit", device: "no-gpu-observation" },
    settings: { width: 64, height: 64, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
    assets: [], textures: [{ asset: "image", width: 4, height: 4, format: "rgba8", mipmapped: false, allocationStateKnown: known }],
  });
  const refusal = (...assessments: ReturnType<typeof assess>[]) => autoMovieRenderBudgetRefusal(
    autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments }),
  );
  const supported = assess("supported", false, true);
  const over = assess("known-over", true, true);
  const unknown = assess("unknown-shot", false, false);
  TestValidator.equals("supported no-limit admission", refusal(supported), null);
  TestValidator.predicate("over-only recovery remains", refusal(over)!.includes("known-over") && refusal(over)!.includes("over budget"));
  TestValidator.predicate("unknown-only diagnostics remain", refusal(unknown)!.includes("unknown-shot") && refusal(unknown)!.includes("image"));
  const both = assess("both-shot", true, false);
  TestValidator.equals("over decision precedence stays intact", both.status, "over");
  const same = refusal(both)!;
  TestValidator.predicate("same-shot retains over and required unknown diagnostics", same.includes("both-shot") && same.includes("over budget") && same.includes("no safe resident texture") && same.includes("image"));
  const separate = refusal(over, unknown)!;
  TestValidator.predicate("separate scopes retain both owning failures", separate.includes("known-over") && separate.includes("unknown-shot") && separate.includes("image") && separate.includes("over budget") && separate.includes("no safe resident texture"));
};
