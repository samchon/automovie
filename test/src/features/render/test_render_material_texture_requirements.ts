import { measureAutoMovieRenderTextureClosure, requiredAutoMovieMaterialTexturePurposes, type IAutoMovieRenderTextureResidency } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Implicit lookups follow used material features and rectangular lighting.
 * Retained storage cannot substitute for missing current consumer facts.
 *
 * Scenarios:
 *
 * 1. Zero-radius SSS still requires its table; overlay normal fallback appears
 *    only without base/detail normal, and PBR area lights require both LTC tables.
 * 2. Missing actual lookup roles remain unknown; actual R-half facts give4096
 *    bytes once across scopes and material removal retains that context storage.
 * 3. Unknown area-light facts in another PBR scope refuse, and data table order
 *    cannot change a complete context's stable allocation rows.
 */
export const test_render_material_texture_requirements = (): void => {
  const plain = material("plain");
  const sss = { ...plain, subsurfaceRadius: { r: 0, g: 0, b: 0 } };
  const overlay = { ...plain, overlays: [{ baseColorTexture: "color", normalTexture: "normal", blend: "multiply" as const, strength: 1 }] };
  const required = (materials = [plain], areaLights = false, defaultPbr = false) =>
    requiredAutoMovieMaterialTexturePurposes({ materials, areaLights, defaultPbr });
  TestValidator.equals("plain materials use no extra lookup", required(), []);
  TestValidator.equals("zero-radius SSS has a table", required([sss]), ["subsurface-lut"]);
  TestValidator.equals("normal overlays require flat fallback", required([overlay]), ["overlay-flat-normal"]);
  TestValidator.equals("explicit absent base and detail normal retain fallback", required([{ ...overlay, normalTexture: null, detailNormalTexture: null }]), ["overlay-flat-normal"]);
  for (const change of [{ normalTexture: "base" }, { detailNormalTexture: "detail" }])
    TestValidator.equals("authored normal prevents fallback", required([{ ...overlay, ...change }]), []);
  TestValidator.equals("no normal overlay prevents fallback", required([{ ...overlay, overlays: [{ ...overlay.overlays[0], normalTexture: null }] }]), []);
  TestValidator.equals("omitted normal overlay prevents fallback", required([{ ...overlay, overlays: [{ ...overlay.overlays[0], normalTexture: undefined }] }]), []);
  TestValidator.equals("PBR area lights require both tables", required([plain], true), ["area-ltc-1", "area-ltc-2"]);
  TestValidator.equals("default PBR area lights require both tables", required([], true, true), ["area-ltc-1", "area-ltc-2"]);
  TestValidator.equals("no PBR consumers need no LTC upload", required([], true), []);
  const row = { owner: "lookup", purpose: "subsurface-lut" as const, residents: ["current", "other"],
    texture: { width: 64, height: 32, format: "r16f" as const, colorSpace: "linear" as const,
      sourceIdentity: "lookup-source", uploadState: "actual-half-lookup", mipmapped: false } };
  const residency: IAutoMovieRenderTextureResidency = { owner: "current", residents: [], dfgRetained: false,
    pmremRetained: null, runtimeTextures: [row] };
  const close = (profile = residency, materials = [sss]) => measureAutoMovieRenderTextureClosure({
    materials, sources: [], environment: null, residency: profile,
  });
  TestValidator.equals("missing current lookup stays unknown", close({ ...residency, runtimeTextures: [] }).filter((cost) => cost.bytes === null).length, 1);
  TestValidator.equals("retained-only lookup cannot fill current role", close({ ...residency, runtimeTextures: [{ ...row, residents: [] }] }).filter((cost) => cost.bytes === null).length, 1);
  TestValidator.equals("actual half table has independent byte bound", close().find((cost) => cost.runtime === "data-texture")!.bytes, 64 * 32 * 2);
  const shared = { ...residency, residents: [{ owner: "other", materials: [sss], sources: [], environment: null,
    shadowCasters: [], areaLights: false }] };
  TestValidator.equals("two scopes share one actual lookup", close(shared).filter((cost) => cost.runtime === "data-texture").length, 1);
  TestValidator.equals("material removal retains actual table", close(residency, []).map((cost) => cost.bytes), [4096]);
  const areaUnknown = { ...shared, residents: [{ ...shared.residents[0], areaLights: undefined }] };
  TestValidator.predicate("unreported lighting policy stays unknown", close(areaUnknown).some((cost) => cost.variant === "area-light-profile:other" && cost.bytes === null));
  const independent = { ...residency, runtimeTextures: [row, { ...row, owner: "other-table", texture: { ...row.texture, sourceIdentity: "independent" } }] };
  TestValidator.equals("independent runtime order is canonical", close(independent), close({ ...independent, runtimeTextures: [...independent.runtimeTextures].reverse() }));
};
