import { IAutoMovieRenderTextureResident } from "../../../../packages/engine/src/render/IAutoMovieRenderTextureResident";
import { AutoMovieBuiltinTexturePurpose } from "../../../../packages/engine/src/render/AutoMovieBuiltinTexturePurpose";
import { IAutoMovieMaterial, IAutoMovieMaterialOverlay, IAutoMovieRenderTextureCost } from "@automovie/interface";
import { measureAutoMovieRenderTextureClosure } from "../../../../packages/engine/src/render/measureAutoMovieRenderTextureClosure";
import { requiredAutoMovieMaterialTexturePurposes } from "../../../../packages/engine/src/render/requiredAutoMovieMaterialTexturePurposes";
import { type IAutoMovieRenderTextureResidency } from "../../../../packages/engine/src/render/IAutoMovieRenderTextureResidency";
import { TestValidator } from "@nestia/e2e";
import { material } from "../internal/renderFixtures";
/**
 * Implicit lookups follow used material features and rectangular lighting. Retained storage cannot substitute for missing current consumer facts.
 *
 * Scenarios:
 *
 * 1. Zero-radius SSS still requires its table; overlay normal fallback appears only without base/detail normal, and PBR area lights require both LTC tables.
 * 2. Missing lookup roles remain unknown; supplied R16F facts give 4096 bytes once across scopes, and material removal retains that declared context storage.
 * 3. Unknown area-light facts in another PBR scope refuse, and data table order cannot change a complete context's stable allocation rows.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual implicit texture roles and closure rows, refusing missing current lookup facts while retaining certified shared tables after material removal.
 * @evidence contracts/testing.md#independent-expectations The declared zero-radius SSS, overlay-normal fallback and PBR rectangular-light rules determine role names; 64 times 32 times two bytes gives the independent R16F table bound. These are supplied texture facts, not measurements of native allocation.
 * @evidence contracts/testing.md#distinguishing-cases Zero radius, base/detail normal presence, absent normal overlays, no PBR consumer, missing/retained-only facts, shared scopes and reversed runtime rows preserve positive and unknown twins.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_material_texture_requirements owns its cases. Portable lookup-role and storage accounting without building a table, uploading pixels or opening a GPU.
 */
export function test_render_material_texture_requirements(): void {
  const plain: IAutoMovieMaterial = material("plain");
  const sss: IAutoMovieMaterial = { ...plain, subsurfaceRadius: { r: 0, g: 0, b: 0 } };
  const overlay: IAutoMovieMaterial & { overlays: IAutoMovieMaterialOverlay[] } = { ...plain, overlays: [{ baseColorTexture: "color", normalTexture: "normal", blend: "multiply" as const, strength: 1 }] };
  const required: (materials?: IAutoMovieMaterial[], areaLights?: boolean, defaultPbr?: boolean) => AutoMovieBuiltinTexturePurpose[] = (materials: IAutoMovieMaterial[] = [plain], areaLights: boolean = false, defaultPbr: boolean = false): AutoMovieBuiltinTexturePurpose[] =>
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
  const row: NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>[number] = { owner: "lookup", purpose: "subsurface-lut" as const, residents: ["current", "other"],
    texture: { width: 64, height: 32, format: "r16f" as const, colorSpace: "linear" as const,
      sourceIdentity: "lookup-source", uploadState: "actual-half-lookup", mipmapped: false } };
  const residency: IAutoMovieRenderTextureResidency = { owner: "current", residents: [], dfgRetained: false,
    pmremRetained: null, runtimeTextures: [row] };
  const close: (profile?: IAutoMovieRenderTextureResidency, materials?: IAutoMovieMaterial[]) => IAutoMovieRenderTextureCost[] = (profile: IAutoMovieRenderTextureResidency = residency, materials: IAutoMovieMaterial[] = [sss]): IAutoMovieRenderTextureCost[] => measureAutoMovieRenderTextureClosure({
    materials, sources: [], environment: null, residency: profile,
  });
  TestValidator.equals("missing current lookup stays unknown", close({ ...residency, runtimeTextures: [] }).filter((cost: IAutoMovieRenderTextureCost): boolean => cost.bytes === null).length, 1);
  TestValidator.equals("retained-only lookup cannot fill current role", close({ ...residency, runtimeTextures: [{ ...row, residents: [] }] }).filter((cost: IAutoMovieRenderTextureCost): boolean => cost.bytes === null).length, 1);
  TestValidator.equals("actual half table has independent byte bound", close().find((cost: IAutoMovieRenderTextureCost): boolean => cost.runtime === "data-texture")!.bytes, 64 * 32 * 2);
  const shared: IAutoMovieRenderTextureResidency & { residents: IAutoMovieRenderTextureResident[] } = { ...residency, residents: [{ owner: "other", materials: [sss], sources: [], environment: null,
    shadowCasters: [], areaLights: false }] };
  TestValidator.equals("two scopes share one actual lookup", close(shared).filter((cost: IAutoMovieRenderTextureCost): boolean => cost.runtime === "data-texture").length, 1);
  TestValidator.equals("material removal retains actual table", close(residency, []).map((cost: IAutoMovieRenderTextureCost): number | null => cost.bytes), [4096]);
  const areaUnknown: IAutoMovieRenderTextureResidency = { ...shared, residents: [{ ...shared.residents[0], areaLights: undefined }] };
  TestValidator.predicate("unreported lighting policy stays unknown", close(areaUnknown).some((cost: IAutoMovieRenderTextureCost): boolean => cost.variant === "area-light-profile:other" && cost.bytes === null));
  const independent: IAutoMovieRenderTextureResidency & { runtimeTextures: NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]> } = { ...residency, runtimeTextures: [row, { ...row, owner: "other-table", texture: { ...row.texture, sourceIdentity: "independent" } }] };
  TestValidator.equals("independent runtime order is canonical", close(independent), close({ ...independent, runtimeTextures: [...independent.runtimeTextures].reverse() }));
}
