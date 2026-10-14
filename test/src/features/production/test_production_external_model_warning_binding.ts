import type { IAutoMovieAssetProvenance, IAutoMovieDiagnostic, IAutoMovieModelRecipe } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import { productionAssetInventory } from "../../../../packages/production/src/production/productionAssetInventory/productionAssetInventory";
import type { IAutoMovieProductionDesignGraph } from "../../../../packages/production/src/production/validateProductionDesign";
import { AUTOMOVIE_REGISTERED_ARCHETYPES } from "../../../../packages/production/src/production/productionArchetypes";
import { baseDocument } from "../internal/ingestMatrix/baseDocument";
import { basePayload } from "../internal/ingestMatrix/basePayload";

/**
 * Advisory material findings keep a valid imported model binding, while actual proxy errors still refuse it.
 *
 * Scenarios:
 *
 * 1. The existing static ingest document and payload bind without warnings.
 * 2. Declaring an unsupported material extension retains visible advice and the same adopted recipe binding.
 * 3. The same advice cannot hide an invalid zero-height collision decision.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual asset inventory with digest-matched in-memory ledger/source/sidecar bytes and observes diagnostics plus the returned externalModels binding; warning-only admission must not silently substitute generated appearance.
 * @evidence contracts/testing.md#independent-expectations The builder's contract permits advisory findings for material semantics it cannot restate; sheen is absent from the authored material surface. Proxy dimensions must be finite and positive. Node crypto independently pins bytes, while existing nonHuman static ingest helpers supply unchanged mesh/payload facts rather than sampling inventory output.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts clean admission, warning-only admission and warning-plus-real-proxy-error refusal using the same static source/payload. Other ingest tests own container/rig/schema boundaries, and this test proves no visible geometry, material rendering or measured envelope.
 * @evidence contracts/testing.md#execution-ownership The named portable test reaches maintained source and reuses existing nonHuman in-memory ingest inputs; it creates no saved asset, Human fixture, process, browser, GPU, installation or dynamic case driver.
 */
export function test_production_external_model_warning_binding(): void {
  const payload: Buffer = basePayload();
  const recipe: IAutoMovieModelRecipe = {
    id: "prop", role: "prop", archetype: "primitive-prop", asset: "assets/m.gltf",
    parameters: { shape: "box", width: 1, height: 1, depth: 1 },
    palette: { neutral: "#808080" }, lod: [{ tier: "hero", maxDistance: null, recipe: "prop" }], capabilities: [], attachments: [],
  };
  const graph: IAutoMovieProductionDesignGraph = { production: null, models: new Map([[recipe.id, recipe]]), world: null, formations: new Map(), shots: new Map(), acceptance: new Map() };
  /** Independently pin the actual input byte population. */
  function digest(bytes: Uint8Array): string { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
  /** Vary only declared extension advice and the explicitly authored proxy boundary. */
  function inspect(warning: boolean, invalidProxy: boolean = false): ReturnType<typeof productionAssetInventory> {
    const source: Buffer = Buffer.from(JSON.stringify({ ...baseDocument(), ...(warning ? { extensionsUsed: ["KHR_materials_sheen"] } : {}) }));
    const model: IAutoMovieAssetProvenance = {
      path: "assets/m.gltf", digest: digest(source), uses: [{ production: "production", consumer: { kind: "model-recipe", id: recipe.id }, reason: "Adopt this static appearance." }],
      model: {
        ingestProfile: "gltf-static-v1", lod: [{ level: "hero", asset: "assets/m.gltf" }],
        collisionProxy: { kind: "generated", recipe: "box-v1", parameters: { width: 1, height: invalidProxy ? 0 : 1, depth: 1 } },
        measurementProxy: { kind: "generated", recipe: "box-v1", parameters: { width: 1, height: 1, depth: 1 } },
      },
    };
    const sidecar: IAutoMovieAssetProvenance = { path: "assets/mesh.bin", digest: digest(payload), uses: [{ production: "production", consumer: { kind: "model-resource", id: model.path }, reason: "Supply the existing position payload." }] };
    return productionAssetInventory("automovie/assets.json", [
      { path: "automovie/assets.json", source: false, render: false, bytes: Buffer.from(JSON.stringify({ version: 1, assets: [model, sidecar] })) },
      { path: model.path, source: false, render: true, bytes: source },
      { path: sidecar.path, source: false, render: true, bytes: payload },
    ], "production", graph, AUTOMOVIE_REGISTERED_ARCHETYPES);
  }
  const clean: ReturnType<typeof productionAssetInventory> = inspect(false);
  TestValidator.equals("clean source remains diagnostic-free", clean.diagnostics, []);
  TestValidator.predicate("clean source binds the declared recipe", clean.externalModels.has(recipe.id));
  const warned: ReturnType<typeof productionAssetInventory> = inspect(true);
  TestValidator.predicate("material advice remains visible", warned.diagnostics.some((finding: IAutoMovieDiagnostic): boolean => finding.code === "asset-model-material-unsupported" && finding.category === "warning"));
  TestValidator.predicate("advice adds no invented error", warned.diagnostics.every((finding: IAutoMovieDiagnostic): boolean => finding.category !== "error"));
  TestValidator.predicate("warning-only model keeps its imported binding", warned.externalModels.has(recipe.id));
  TestValidator.equals("warning-only binding retains declared asset", warned.externalModels.get(recipe.id)?.asset, recipe.asset);
  const refused: ReturnType<typeof productionAssetInventory> = inspect(true, true);
  TestValidator.predicate("actual invalid proxy remains an error", refused.diagnostics.some((finding: IAutoMovieDiagnostic): boolean => finding.code === "asset-model-proxy-dangling" && finding.category === "error"));
  TestValidator.predicate("advice cannot admit an invalid proxy", refused.externalModels.has(recipe.id) === false);
}
