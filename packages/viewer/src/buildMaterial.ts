import { IAutoMovieMaterial, type IAutoMovieColor, type IAutoMovieMaterialOverlay } from "@automovie/interface";
import * as THREE from "three";

import { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver.js";
import { applyDetailNormal } from "./detailNormalShading/index.js";
import { applyMaterialOverlays } from "./materialOverlayShading/index.js";
import { resolveAutoMovieMaterialTexture } from "./resolveAutoMovieMaterialTexture.js";
import { applySubsurfaceShading } from "./subsurfaceShading/index.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";

/**
 * Build a `three.js` physical PBR material from an automovie material. It
 * carries the material's name, or its id when unnamed, as the glTF export
 * does, so a preview can recognise a finish by it.
 * The producer owns its new material before resolving texture bindings. Setup
 * failure retires that material and preserves cleanup causes; resolver textures
 * and shared shader tables remain owned by their actual producers.
 *
 * @evidence contracts/common.md#principled-implementation Maps admitted linear PBR coefficients/alpha policy into MeshPhysicalMaterial and resolves binding-private textures with explicit color-space roles; glTF combined metallic-roughness uses one shared binding, while subsurface/detail/overlay shader features follow their actual producer conventions rather than claiming a measured full spectral material model.
 * @evidence contracts/common.md#clear-and-simple-design Owns material field realization and delegates sampler admission plus feature-specific shader injection to their existing owners; optional omission yields documented scalar/default behavior without a second material representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses authored coefficients and contract defaults (mask cutoff0.5, ior1.5, neutral overlay factors), not expected-frame textures; no resolver/global method is replaced, and unresolved optional maps produce scalar material rather than pretending an image was decoded.
 * @evidence contracts/common.md#meaningful-documentation Documents name/id identity, new-material ownership, separate texture/shared-table lifetime and failure preservation; individual texture roles and detail-only normal fallback are explicit in their owning helpers/comments.
 * @evidence contracts/performance.md#efficient-algorithms Performs fixed PBR/binding setup plus O(K) authored overlay resolution and feature source initialization; material storage grows with active texture/overlay bindings, not mesh vertices or instance population, and combined metallic/roughness reuses one resolved texture.
 * @evidence contracts/performance.md#reuse-equivalent-work Resolves the shared metallic-roughness binding once and borrows primed texture-cache bindings, while model/library owners share equivalent material variants across parts/surfaces; this producer creates one independent material per request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registers its new material before binding/shader setup and retires it on failure; successful material transfers to caller, whereas resolver texture wrappers and shader tables stay with their owning cache/producer. Material references retain borrowed bindings until the material/owner becomes unreachable.
 */
export const buildMaterial: (material: IAutoMovieMaterial, resolveTexture?: IAutoMovieTextureResolver) => THREE.MeshPhysicalMaterial = (
  material: IAutoMovieMaterial,
  resolveTexture?: IAutoMovieTextureResolver,
): THREE.MeshPhysicalMaterial => {
  return constructAutoMovieOwnedResources((own: <Resource extends { dispose(): void; }>(resource: Resource) => Resource): THREE.MeshPhysicalMaterial => {
  const c: IAutoMovieColor = material.baseColor;
  const alphaMode: string =
    material.alphaMode ?? (material.opacity < 1 ? "blend" : "opaque");
  const std: THREE.MeshPhysicalMaterial = own(new THREE.MeshPhysicalMaterial({
    name: material.name ?? material.id,
    color: new THREE.Color(c.r, c.g, c.b),
    metalness: material.metallic,
    roughness: material.roughness,
    transparent: alphaMode === "blend",
    depthWrite: alphaMode !== "blend",
    opacity: material.opacity,
    alphaTest: alphaMode === "mask" ? (material.alphaCutoff ?? 0.5) : 0,
    side: material.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
    transmission: material.transmission ?? 0,
    ior: material.ior ?? 1.5,
    thickness: material.thickness ?? 0,
    clearcoat: material.clearcoat ?? 0,
  }));
  if (material.subsurfaceRadius !== undefined)
    applySubsurfaceShading(std, material.subsurfaceRadius);
  std.map = resolveAutoMovieMaterialTexture(
    material.baseColorTexture,
    "srgb",
    resolveTexture,
  );
  const metallicRoughness: THREE.Texture<unknown, THREE.TextureEventMap> | null = resolveAutoMovieMaterialTexture(
    material.metallicRoughnessTexture,
    "linear",
    resolveTexture,
  );
  std.metalnessMap = metallicRoughness;
  std.roughnessMap = metallicRoughness;
  std.normalMap = resolveAutoMovieMaterialTexture(
    material.normalTexture,
    "linear",
    resolveTexture,
  );
  if (material.normalScale !== undefined)
    std.normalScale.setScalar(material.normalScale);
  const detailNormal: THREE.Texture<unknown, THREE.TextureEventMap> | null = resolveAutoMovieMaterialTexture(
    material.detailNormalTexture,
    "linear",
    resolveTexture,
  );
  if (detailNormal !== null) {
    if (std.normalMap !== null)
      applyDetailNormal(std, detailNormal, material.detailNormalScale ?? 1);
    else {
      // a detail map alone stands in as the normal map
      std.normalMap = detailNormal;
      std.normalScale.setScalar(material.detailNormalScale ?? 1);
    }
  }
  const overlays: { color: THREE.Texture<unknown, THREE.TextureEventMap> | null; blend: "multiply" | "replace"; colorFactor: { r: number; g: number; b: number; }; roughness: number | null; normal: THREE.Texture<unknown, THREE.TextureEventMap> | null; normalScale: number; strength: number; }[] = (material.overlays ?? []).map((overlay: IAutoMovieMaterialOverlay): { color: THREE.Texture<unknown, THREE.TextureEventMap> | null; blend: "multiply" | "replace"; colorFactor: { r: number; g: number; b: number; }; roughness: number | null; normal: THREE.Texture<unknown, THREE.TextureEventMap> | null; normalScale: number; strength: number; } => ({
    color: resolveAutoMovieMaterialTexture(
      overlay.baseColorTexture,
      "srgb",
      resolveTexture,
    ),
    blend: overlay.blend,
    colorFactor: overlay.colorFactor ?? { r: 1, g: 1, b: 1 },
    roughness: overlay.roughness ?? null,
    normal: resolveAutoMovieMaterialTexture(
      overlay.normalTexture,
      "linear",
      resolveTexture,
    ),
    normalScale: overlay.normalScale ?? 1,
    strength: overlay.strength,
  }));
  // an overlay shows only through its colour image; without a resolver there
  // is none, and the material shows alone
  applyMaterialOverlays(
    std,
    overlays.flatMap((overlay: { color: THREE.Texture<unknown, THREE.TextureEventMap> | null; blend: "multiply" | "replace"; colorFactor: { r: number; g: number; b: number; }; roughness: number | null; normal: THREE.Texture<unknown, THREE.TextureEventMap> | null; normalScale: number; strength: number; }): { color: THREE.Texture<unknown, THREE.TextureEventMap>; blend: "multiply" | "replace"; colorFactor: { r: number; g: number; b: number; }; roughness: number | null; normal: THREE.Texture<unknown, THREE.TextureEventMap> | null; normalScale: number; strength: number; }[] =>
      overlay.color === null ? [] : [{ ...overlay, color: overlay.color }],
    ),
  );
  std.aoMap = resolveAutoMovieMaterialTexture(
    material.occlusionTexture,
    "linear",
    resolveTexture,
  );
  std.aoMapIntensity = material.occlusionStrength ?? 1;
  std.emissiveMap = resolveAutoMovieMaterialTexture(
    material.emissiveTexture,
    "srgb",
    resolveTexture,
  );
  if (material.emissive !== null)
    std.emissive = new THREE.Color(
      material.emissive.r,
      material.emissive.g,
      material.emissive.b,
    );
  else if (std.emissiveMap !== null) std.emissive.setRGB(1, 1, 1);
  return std;
  });
};
