import { defaultMaterial as defaultMaterialImplementation } from "./internal/defaultMaterial.js";
import { materialTextureBindings as materialTextureBindingsImplementation } from "./internal/materialTextureBindings.js";

import type * as THREE from "three";
import { type IAutoMovieShot, type AutoMovieTextureBinding, type IAutoMovieMaterial } from "@automovie/interface";
import { type IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import { applyPracticalSurfaceMaterials as applyPracticalSurfaceMaterialsImplementation } from "./internal/applyPracticalSurfaceMaterials.js";

/** Public operations for Auto Movie Render Material. */
export namespace AutoMovieRenderMaterial {
  /**
   * Apply an admitted shot's practical surface cues to built prop instances.
   *
   * Before drawing a frame of the shot, call this with its shot-local seconds in
   * [0, duration). Resolve scene node ids to the distinct model objects mounted
   * for those placements, for example by keeping the results supplied to
   * buildScene. Resolve each model-scoped material id to a prepared, geometry-
   * compatible material for that node and part. The host can use buildMaterial
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
