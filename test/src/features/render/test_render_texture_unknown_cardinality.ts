import { autoMovieRenderTextureDigest, deriveAutoMovieSemanticMask, measureAutoMovieRenderInventory, measureAutoMovieRenderTextureClosure, type IAutoMovieRenderTextureResidency, type IAutoMovieRenderSubject, type IAutoMovieRenderTextureSource, type IAutoMovieRenderTextureResident } from "@automovie/engine";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type { DataTexture } from "three";
import type { IAutoMovieRenderAnalysisGap, IAutoMovieRenderOwnerCost } from "@automovie/interface";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";

/**
 * Uncertified native allocation state cannot become a numeric byte or texture
 * population claim merely because two current property records look alike.
 *
 * Scenarios:
 *
 * 1. Adjacent supported no-manual Source/state facts share one64-byte upload;
 *    uncertified state propagates null bytes and null allocation cardinality.
 * 2. Mixed known/unknown candidate sharing retains all source/runtime users and
 *    propagates uncertainty instead of reporting one allocation or contradiction.
 * 3. Inventory omits fake numeric owner rows, records both gaps and totals, and
 *    unbudgeted normal preflight refuses with its shot and asset diagnostics.
 * 4. Invalid sampler/missing multi-resident authority produce the same unknown
 *    cardinality; supported corrected facts recover and change the sealed target.
 *
 * @evidence contracts/testing.md#behavioral-verification Propagates uncertified source, sampler and sharing authority through actual closure, inventory and explicit compiled-shot assessment, preserving unknown counts/bytes and generating source/runtime diagnostics.
 * @evidence contracts/testing.md#independent-expectations One 4-by-4 RGBA8 image costs 64 bytes and one allocation; its PBR lookup adds 1024 bytes and one allocation. Null bounds, literal owner identities and the two gap metrics independently state the uncertainty contract.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts supported and uncertified source state, invalid sampler, missing multi-resident authority, mixed known/unknown runtime grouping and runtime-only uncertainty, then corrected facts and target invalidation.
 * @evidence contracts/testing.md#execution-ownership Owns one CPU Three DataTexture and synchronous supplied context metadata after asynchronous module loading, disposes it on the successful path and uses partial compiled-shot fixtures; no GPU allocation, native retirement or automatic render-job gate is observed, and failure cleanup is not asserted.
 */
export async function test_render_texture_unknown_cardinality(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const texture: DataTexture = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  const source: IAutoMovieRenderTextureSource = readAutoMovieTextureSource("image", texture);
  const first: ReturnType<typeof material> = material("first", "image");
  const second: ReturnType<typeof material> = material("second", "image");
  const residency: IAutoMovieRenderTextureResidency = { owner: "current", residents: [], dfgRetained: false, pmremRetained: null };
  const close: (actual?: IAutoMovieRenderTextureSource, profile?: IAutoMovieRenderTextureResidency) => ReturnType<typeof measureAutoMovieRenderTextureClosure> = (actual: IAutoMovieRenderTextureSource = source, profile: IAutoMovieRenderTextureResidency = residency): ReturnType<typeof measureAutoMovieRenderTextureClosure> => measureAutoMovieRenderTextureClosure({
    materials: [first, second], sources: [actual], environment: null, residency: profile,
  });
  TestValidator.equals("supported property sharing remains one allocation", close().filter((row: ReturnType<typeof close>[number]): boolean => row.asset !== null).map((row: ReturnType<typeof close>[number]): [number | null, number] => [row.bytes, row.allocations ?? 1]), [[4 * 4 * 4, 1]]);
  const unknown: IAutoMovieRenderTextureSource = { ...source, allocationStateKnown: false };
  for (const uncertain of [unknown, { ...source, samplerState: null }]) {
    const row: ReturnType<typeof close>[number] = close(uncertain).find((row: ReturnType<typeof close>[number]): boolean => row.asset === "image")!;
    TestValidator.equals("uncertified native state has no byte/count claim", [row.bytes, row.allocations], [null, null]);
    TestValidator.equals("all material users remain named", row.materials, ["first", "second"]);
  }
  const { asset: _asset, ...runtime }: IAutoMovieRenderTextureSource = unknown;
  const mixed: ReturnType<typeof close> = close(source, { ...residency, runtimeTextures: [{ owner: "table", texture: runtime }] });
  TestValidator.equals("unknown mixed grouping is not false contradiction", mixed.filter((row: ReturnType<typeof close>[number]): boolean => row.asset === "image").map((row: ReturnType<typeof close>[number]): [number | null, number | null | undefined, string[] | undefined] => [row.bytes, row.allocations, row.runtimeOwners]), [[null, null, ["table"]]]);
  const other: IAutoMovieRenderTextureResident = { owner: "other", materials: [second], sources: [source], environment: null, shadowCasters: [], areaLights: false };
  for (const omission of [{ sourceIdentity: undefined }, { uploadState: undefined }])
    TestValidator.predicate("missing multi-resident authority has unknown cardinality", close({ ...source, ...omission }, { ...residency, residents: [other] }).some((row: ReturnType<typeof close>[number]): boolean => row.allocations === null));
  const model: ReturnType<typeof boxModel> = boxModel({ id: "model", materials: [first] });
  const scene: ReturnType<typeof sceneFixture> = { ...sceneFixture(), lights: [], nodes: [{ ...sceneFixture().nodes[0], model: model.id }] };
  const subject: IAutoMovieRenderSubject = { scene, models: [model], textures: [unknown], textureResidency: residency };
  const inventory: ReturnType<typeof measureAutoMovieRenderInventory> = measureAutoMovieRenderInventory({ subject, mask: deriveAutoMovieSemanticMask(subject) });
  TestValidator.equals("both total quantities remain unknown", [inventory.totals.textureBytes, inventory.totals.textures], [null, null]);
  TestValidator.equals("both texture uncertainty dimensions have gaps", inventory.gaps.filter((gap: IAutoMovieRenderAnalysisGap): boolean => gap.metric === "textures" || gap.metric === "textureBytes").map((gap: IAutoMovieRenderAnalysisGap): string => gap.metric).sort((left: string, right: string): number => left.localeCompare(right, "en")), ["textureBytes", "textures"]);
  TestValidator.equals("unknown owner has no fake zero/one count", inventory.owners.filter((row: IAutoMovieRenderOwnerCost): boolean => row.owner === "texture:image" && (row.metric === "textureBytes" || row.metric === "textures")), []);
  TestValidator.predicate("known lookup subtotal stays attributed", inventory.owners.some((row: IAutoMovieRenderOwnerCost): boolean => row.metric === "textures" && row.owner === "renderer:dfg-lut" && row.cost === 1));
  const compiled: ReturnType<typeof compiledShotFixture> = compiledShotFixture({ models: [model], scene });
  const assess: (actual?: IAutoMovieRenderTextureSource) => ReturnType<typeof assessAutoMovieRenderBudget> = (actual: IAutoMovieRenderTextureSource = unknown): ReturnType<typeof assessAutoMovieRenderBudget> => assessAutoMovieRenderBudget({ compiled, shot: "uncertain-shot", budget: null,
    renderer: { api: "webgl2", vendor: "typed-metadata-unit", device: "no-gpu-observation" },
    settings: { width: 64, height: 64, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
    assets: [], textures: [actual], textureResidency: residency,
  });
  const uncertain: ReturnType<typeof assess> = assess();
  const message: string = autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [uncertain] }))!;
  TestValidator.predicate("required unknown costs refuse with stable scope and asset", message.includes("uncertain-shot") && message.includes("image"));
  const supported: ReturnType<typeof assess> = assess({ ...source, allocationStateKnown: true });
  TestValidator.equals("supported source recovers both quantities", [supported.inventory!.totals.textureBytes, supported.inventory!.totals.textures], [64 + 1024, 2]);
  TestValidator.equals("supported source admits", autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [supported] })), null);
  TestValidator.predicate("certainty recovery invalidates target", uncertain.target!.textureDigest !== supported.target!.textureDigest);
  TestValidator.predicate("certainty is a direct digest input", autoMovieRenderTextureDigest([unknown], residency) !== autoMovieRenderTextureDigest([{ ...source, allocationStateKnown: true }], residency));
  const runtimeModel: ReturnType<typeof boxModel> = boxModel({ id: "runtime-model", materials: [material("plain")] });
  const runtimeScene: ReturnType<typeof sceneFixture> = { ...scene, nodes: [{ ...scene.nodes[0], model: runtimeModel.id }] };
  const runtimeCompiled: ReturnType<typeof compiledShotFixture> = compiledShotFixture({ models: [runtimeModel], scene: runtimeScene });
  const runtimeProfile: IAutoMovieRenderTextureResidency = { ...residency, runtimeTextures: [{ owner: "formation:walk-table", texture: runtime }] };
  const runtimeAssessment: ReturnType<typeof assessAutoMovieRenderBudget> = assessAutoMovieRenderBudget({ compiled: runtimeCompiled, shot: "runtime-only-shot", budget: null,
    renderer: { api: "webgl2", vendor: "typed-metadata-unit", device: "no-gpu-observation" },
    settings: { width: 64, height: 64, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
    assets: [], textures: [], textureResidency: runtimeProfile,
  });
  TestValidator.equals("runtime-only unknown keeps both absent totals", [runtimeAssessment.inventory!.totals.textureBytes,
    runtimeAssessment.inventory!.totals.textures], [null, null]);
  const runtimeMessage: string = autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [runtimeAssessment] }))!;
  TestValidator.predicate("normal refusal preserves actual generating runtime and shot", runtimeMessage.includes("formation:walk-table") && runtimeMessage.includes("runtime-only-shot"));
  TestValidator.equals("uncertain runtime attribution survives numeric owner omission", runtimeAssessment.inventory!.textures.find((row: ReturnType<typeof close>[number]): boolean => row.runtime === "data-texture")!.runtimeOwners, ["formation:walk-table"]);
  const runtimeKnown: Omit<IAutoMovieRenderTextureSource, "asset"> = { ...runtime, allocationStateKnown: true };
  const runtimeRecovered: ReturnType<typeof assessAutoMovieRenderBudget> = assessAutoMovieRenderBudget({ compiled: runtimeCompiled, shot: "runtime-only-shot", budget: null,
    renderer: { api: "webgl2", vendor: "typed-metadata-unit", device: "no-gpu-observation" },
    settings: { width: 64, height: 64, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
    assets: [], textures: [], textureResidency: { ...residency, runtimeTextures: [{ owner: "formation:walk-table", texture: runtimeKnown }] },
  });
  TestValidator.equals("supported runtime recovers its independent count and byte sum", [runtimeRecovered.inventory!.totals.textureBytes, runtimeRecovered.inventory!.totals.textures], [64 + 1024, 2]);
  TestValidator.equals("supported runtime returns normal admission", autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [runtimeRecovered] })), null);
  texture.dispose();
}
