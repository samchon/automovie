import { defaultMaterial as defaultMaterialImplementation } from "./internal/defaultMaterial.js";
import { materialTextureBindings as materialTextureBindingsImplementation } from "./internal/materialTextureBindings.js";

import type * as THREE from "three";
import { type IAutoMovieShot, type AutoMovieTextureBinding, type IAutoMovieMaterial } from "@automovie/interface";
import { type IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import type { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver.js";
import type { IMaterialShaderPatch } from "./IMaterialShaderPatch.js";
import { buildMaterial as buildMaterialImplementation } from "./internal/buildMaterial.js";
import { addMaterialShaderPatch as addMaterialShaderPatchImplementation } from "./internal/addMaterialShaderPatch.js";
import { applyMaterialShaderPatches as applyMaterialShaderPatchesImplementation } from "./internal/applyMaterialShaderPatches.js";

import { applyPracticalSurfaceMaterials as applyPracticalSurfaceMaterialsImplementation } from "./internal/applyPracticalSurfaceMaterials.js";

/** Public operations for Auto Movie Render Material. */
export namespace AutoMovieRenderMaterial {
  /** One patch operation applied to the same caller-owned shader value. */
  export type IShaderPatchApplication<Shader> = {
    apply: (shader: Shader) => void;
  };

  /** Build one owned Three physical material for a canonical material record. */
  export const build: (
    material: IAutoMovieMaterial,
    resolveTexture?: IAutoMovieTextureResolver,
  ) => THREE.MeshPhysicalMaterial = (
    material: IAutoMovieMaterial,
    resolveTexture?: IAutoMovieTextureResolver,
  ): THREE.MeshPhysicalMaterial =>
    buildMaterialImplementation(material, resolveTexture);

  /** Register a material shader patch in stable key order. */
  export const addShaderPatch: (
    material: THREE.Material,
    patch: IMaterialShaderPatch,
  ) => void = (
    material: THREE.Material,
    patch: IMaterialShaderPatch,
  ): void => addMaterialShaderPatchImplementation(material, patch);

  /** Apply shader patch operations in registration order. */
  export const applyShaderPatches: <Shader>(
    patches: readonly IShaderPatchApplication<Shader>[],
    shader: Shader,
  ) => void = <Shader>(
    patches: readonly IShaderPatchApplication<Shader>[],
    shader: Shader,
  ): void => applyMaterialShaderPatchesImplementation(patches, shader);

  /**
   * Apply an admitted shot's practical surface cues to built prop instances.
   *
   * Before drawing a frame of the shot, call this with its shot-local seconds in
   * [0, duration). Resolve scene node ids to the distinct model objects mounted
   * for those placements, for example by keeping the results supplied to
   * buildScene. Resolve each model-scoped material id to a prepared, geometry-
   * compatible material for that node and part. The host can use AutoMovieRenderMaterial.build
   * with its existing texture resolver and retains ownership of those materials
   * and textures. An initial key can select the part's original material by
   * supplying that same reference.
   *
   * This updates only tracked parts. When reusing a mounted scene across shots,
   * restore its staged materials or author opening tracks for parts whose prior
   * shot changed their material.
   *
   * @throws {RangeError} The tracked shot sample is outside its local interval.
   * @throws {Error} A target has no distinct single-material mesh, or its
   *   selected variant is unavailable.
   */
  export function applyPracticalSurfaceMaterials(shot: IAutoMovieShot, seconds: number, resolveNode: (node: string) => IAutoMovieModelObject | undefined, resolveMaterial: (
    node: string,
    part: string,
    material: string,
  ) => THREE.Material | undefined): void {
    applyPracticalSurfaceMaterialsImplementation(shot, seconds, resolveNode, resolveMaterial);
  }

  /**
   * Neutral linear-gray rough dielectric used for a part without a material.
   * Caller owns this new material; no decoded texture or shader table is
   * acquired.
   */
  export function createDefault(): THREE.MeshStandardMaterial {
    return defaultMaterialImplementation();
  }

  /**
   * Every texture binding one material declares, in slot order, then the
   * thickness and anisotropy maps, then each overlay's colour and normal map,
   * nulls dropped.
   */
  export function textureBindings(material: IAutoMovieMaterial): AutoMovieTextureBinding[] {
    return materialTextureBindingsImplementation(material);
  }
}
