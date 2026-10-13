import { deriveAutoMovieSemanticMask, evaluateAutoMovieRenderBudget, measureAutoMovieRenderInventory, sealAutoMovieRenderTarget } from "@automovie/engine";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { compiledShotFixture, renderBudgetFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";
import { renderBudgetFindingShape } from "../internal/renderBudgetFindingShape";

/**
 * Safe individual textures do not imply a safe combined resident bound. Shared
 * PBR lookup storage is accounted once and never ranked as an editable asset.
 * Unknown required upload storage prevents admission through the real preflight.
 *
 * Scenarios:
 *
 * 1. Two RGBA8 images each costing 2^52 bytes overflow the exact integer total;
 *    the adjacent small image set has a complete bound.
 * 2. One untextured PBR model charges the 1024-byte shared lookup, including it
 *    in omitted accounting while keeping it outside editable owner ranking.
 * 3. Missing texture facts refuse with source and shot identities; supplying
 *    decoded RGBA8 facts clears admission without changing authored materials.
 */
export const test_render_texture_budget_bound = (): void => {
  const model = boxModel({ id: "model", parts: 2, materials: [material("a", "a"), material("b", "b")] });
  const scene = { ...sceneFixture(), nodes: [{ ...sceneFixture().nodes[0], model: "model" }], lights: [] };
  const subject = { scene, models: [model], textures: ["a", "b"].map((asset) => ({ asset, width: 2 ** 25, height: 2 ** 25, mipmapped: false, format: "rgba8" as const })) };
  const mask = deriveAutoMovieSemanticMask(subject);
  const huge = measureAutoMovieRenderInventory({ subject, mask });
  TestValidator.equals("combined bound refuses overflow", huge.totals.textureBytes, null);
  TestValidator.predicate("combined overflow is diagnosed", huge.gaps.some((gap) => gap.metric === "textureBytes" && gap.reason.includes("safe integer")));
  const small = measureAutoMovieRenderInventory({ subject: { ...subject, textures: subject.textures.map((fact) => ({ ...fact, width: 4, height: 4 })) }, mask });
  TestValidator.equals("independently computed small total", small.totals.textureBytes, 2 * 4 * 4 * 4 + 16 * 16 * 2 * 2);
  const untextured = { scene, models: [boxModel({ id: "model" })] };
  const bareMask = deriveAutoMovieSemanticMask(untextured);
  const inventory = measureAutoMovieRenderInventory({ subject: untextured, mask: bareMask });
  TestValidator.equals("default PBR still owns a lookup", inventory.totals.textureBytes, 1024);
  const target = sealAutoMovieRenderTarget({ renderer: { api: "webgl2", vendor: "test", device: "gpu" }, settings: {
    width: 64, height: 64, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1,
  }, assets: [] });
  const report = evaluateAutoMovieRenderBudget({ inventory, mask: bareMask, target, budget: renderBudgetFixture({ tier: "test", limits: { textureBytes: 0 } }) });
  const finding = report.findings.find((row) => row.metric === "textureBytes")!;
  TestValidator.equals("runtime storage is not an editable source", finding.contributors, []);
  TestValidator.equals("runtime omission accounting", [finding.omittedCost, finding.omittedContributors], [1024, 1]);
  TestValidator.equals("runtime-only overrun invents no editable identity", renderBudgetFindingShape(finding), {
    status: "over", excess: 1024, owner: undefined, source: undefined, cost: undefined, recovers: false,
  });
  const assess = (known: boolean) => assessAutoMovieRenderBudget({ compiled: compiledShotFixture({ scene, models: [model] }), shot: "shot", budget: null,
    renderer: target.renderer, settings: target.settings, assets: [],
    textures: known ? subject.textures.map((fact) => ({ ...fact, width: 4, height: 4 })) : undefined,
  });
  const refusal = (known: boolean) => autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "test", budgets: undefined, assessments: [assess(known)] }));
  TestValidator.predicate("unknown required upload refuses", refusal(false)?.includes("shot") === true && refusal(false)?.includes("resident texture") === true);
  TestValidator.equals("known upload admits", refusal(true), null);
};
