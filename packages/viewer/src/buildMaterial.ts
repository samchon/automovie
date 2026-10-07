import { IAutoMovieMaterial } from "@automovie/interface";
import * as THREE from "three";

import { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver";
import { applyDetailNormal } from "./detailNormalShading";
import { applyMaterialOverlays } from "./materialOverlayShading";
import { resolveAutoMovieMaterialTexture } from "./resolveAutoMovieMaterialTexture";
import { applySubsurfaceShading } from "./subsurfaceShading";

/**
 * Build a `three.js` physical PBR material from an automovie material. It
 * carries the material's name, or its id when unnamed, as the glTF export
 * does, so a preview can recognise a finish by it.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
 */
export const buildMaterial = (
  material: IAutoMovieMaterial,
  resolveTexture?: IAutoMovieTextureResolver,
): THREE.MeshPhysicalMaterial => {
  const c = material.baseColor;
  const alphaMode =
    material.alphaMode ?? (material.opacity < 1 ? "blend" : "opaque");
  const std = new THREE.MeshPhysicalMaterial({
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
  });
  if (material.subsurfaceRadius !== undefined)
    applySubsurfaceShading(std, material.subsurfaceRadius);
  std.map = resolveAutoMovieMaterialTexture(
    material.baseColorTexture,
    "srgb",
    resolveTexture,
  );
  const metallicRoughness = resolveAutoMovieMaterialTexture(
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
  const detailNormal = resolveAutoMovieMaterialTexture(
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
  const overlays = (material.overlays ?? []).map((overlay) => ({
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
    overlays.flatMap((overlay) =>
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
};
