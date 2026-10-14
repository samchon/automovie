import { deriveAutoMovieSemanticMask, evaluateAutoMovieRenderBudget, measureAutoMovieRenderInventory, sealAutoMovieRenderTarget, type IAutoMovieRenderSubject, type IAutoMovieRenderTextureSource } from "@automovie/engine";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieModel, IAutoMovieScene, IAutoMovieRenderAnalysisGap, IAutoMovieRenderFinding } from "@automovie/interface";

import { compiledShotFixture, renderBudgetFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";
import { renderBudgetFindingShape } from "../internal/renderBudgetFindingShape";

/**
 * Safe individual textures do not imply a safe combined resident bound. Shared
 * PBR lookup storage is accounted once and never ranked as an editable asset.
 * Unknown required upload storage produces a diagnostic through the supplied
 * compiled-shot assessment; this case does not exercise an automatic job gate.
 *
 * Scenarios:
 *
 * 1. Two RGBA8 images each costing 2^52 bytes overflow the exact integer total;
 *    the adjacent small image set has a complete bound.
 * 2. One untextured PBR model charges the 1024-byte shared lookup, including it
 *    in omitted accounting while keeping it outside editable owner ranking.
 * 3. Missing texture facts refuse with source and shot identities; supplying
 *    decoded RGBA8 facts clears admission without changing authored materials.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures combined texture storage, runtime-only contributor accounting and unknown-storage refusal text through the actual inventory, budget and explicit compiled-shot assessment functions.
 * @evidence contracts/testing.md#independent-expectations Safe-integer overflow follows two 2^52-byte images; the adjacent 1152-byte total and 1024-byte lookup omission are arithmetic expectations, not copies of another inventory result.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts individually safe versus combined-overflow images, editable images versus runtime-only storage and omitted versus supplied decoded facts while preserving materials.
 * @evidence contracts/testing.md#execution-ownership Owns a portable synchronous metadata case with a deliberately partial compiled-shot fixture and supplied renderer identity; no renderer draw, native allocation or automatic production refusal is observed, and execution belongs to the test runner.
 */
export function test_render_texture_budget_bound(): void {
  const model: IAutoMovieModel = boxModel({ id: "model", parts: 2, materials: [material("a", "a"), material("b", "b")] });
  const scene: IAutoMovieScene = { ...sceneFixture(), nodes: [{ ...sceneFixture().nodes[0], model: "model" }], lights: [] };
  const subject: IAutoMovieRenderSubject & { textures: IAutoMovieRenderTextureSource[] } = { scene, models: [model], textures: ["a", "b"].map((asset: string): IAutoMovieRenderTextureSource => ({ asset, width: 2 ** 25, height: 2 ** 25, mipmapped: false, format: "rgba8" as const })) };
  const mask: ReturnType<typeof deriveAutoMovieSemanticMask> = deriveAutoMovieSemanticMask(subject);
  const huge: ReturnType<typeof measureAutoMovieRenderInventory> = measureAutoMovieRenderInventory({ subject, mask });
  TestValidator.equals("combined bound refuses overflow", huge.totals.textureBytes, null);
  TestValidator.predicate("combined overflow is diagnosed", huge.gaps.some((gap: IAutoMovieRenderAnalysisGap): boolean => gap.metric === "textureBytes" && gap.reason.includes("safe integer")));
  const small: ReturnType<typeof measureAutoMovieRenderInventory> = measureAutoMovieRenderInventory({ subject: { ...subject, textures: subject.textures.map((fact: IAutoMovieRenderTextureSource): IAutoMovieRenderTextureSource => ({ ...fact, width: 4, height: 4 })) }, mask });
  TestValidator.equals("independently computed small total", small.totals.textureBytes, 2 * 4 * 4 * 4 + 16 * 16 * 2 * 2);
  const untextured: IAutoMovieRenderSubject = { scene, models: [boxModel({ id: "model" })] };
  const bareMask: ReturnType<typeof deriveAutoMovieSemanticMask> = deriveAutoMovieSemanticMask(untextured);
  const inventory: ReturnType<typeof measureAutoMovieRenderInventory> = measureAutoMovieRenderInventory({ subject: untextured, mask: bareMask });
  TestValidator.equals("default PBR still owns a lookup", inventory.totals.textureBytes, 1024);
  const target: ReturnType<typeof sealAutoMovieRenderTarget> = sealAutoMovieRenderTarget({ renderer: { api: "webgl2", vendor: "test", device: "gpu" }, settings: {
    width: 64, height: 64, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1,
  }, assets: [] });
  const report: ReturnType<typeof evaluateAutoMovieRenderBudget> = evaluateAutoMovieRenderBudget({ inventory, mask: bareMask, target, budget: renderBudgetFixture({ tier: "test", limits: { textureBytes: 0 } }) });
  const finding: IAutoMovieRenderFinding = report.findings.find((row: IAutoMovieRenderFinding): boolean => row.metric === "textureBytes")!;
  TestValidator.equals("runtime storage is not an editable source", finding.contributors, []);
  TestValidator.equals("runtime omission accounting", [finding.omittedCost, finding.omittedContributors], [1024, 1]);
  TestValidator.equals("runtime-only overrun invents no editable identity", renderBudgetFindingShape(finding), {
    status: "over", excess: 1024, owner: undefined, source: undefined, cost: undefined, recovers: false,
  });
  const assess: (known: boolean) => ReturnType<typeof assessAutoMovieRenderBudget> = (known: boolean): ReturnType<typeof assessAutoMovieRenderBudget> => assessAutoMovieRenderBudget({ compiled: compiledShotFixture({ scene, models: [model] }), shot: "shot", budget: null,
    renderer: target.renderer, settings: target.settings, assets: [],
    textures: known ? subject.textures.map((fact: IAutoMovieRenderTextureSource): IAutoMovieRenderTextureSource => ({ ...fact, width: 4, height: 4 })) : undefined,
  });
  const refusal: (known: boolean) => string | null = (known: boolean): string | null => autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "test", budgets: undefined, assessments: [assess(known)] }));
  TestValidator.predicate("unknown required upload refuses", refusal(false)?.includes("shot") === true && refusal(false)?.includes("resident texture") === true);
  TestValidator.equals("known upload admits", refusal(true), null);
}
