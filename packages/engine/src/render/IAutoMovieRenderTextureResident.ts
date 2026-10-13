import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One live shot's texture consumers in a shared graphics context. The capture
 * host supplies actual decoded objects and excludes disposed shots; authors
 * supply materials and environment declarations, never GPU identity tokens.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Keeps independently decoded live-shot resources separate until actual source sharing is known.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries the live resident scope needed to bound a shared renderer without charging resources once per scene.
 * @author Samchon
 */
export interface IAutoMovieRenderTextureResident {
  /**
   * Other live scope's required shadow map/filter roles from the shared policy
   * resolver. An empty list states no casters; omission leaves that scope's
   * shadow storage unreported and cannot certify a reused context.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries every retained scope's required shadow consumers into the context closure.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates an observed empty caster population from missing shadow facts.
   */
  shadowCasters?: readonly { light: string; filterDraws: number }[];

  /**
   * Whether this live scope declares rectangular lights. Missing lighting
   * facts cannot certify the lookup closure of its physically based surfaces.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Connects other scopes' rectangular lighting to its shared native lookup consumers.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps observed absent area lighting distinct from unreported requirements.
   */
  areaLights?: boolean;

  /**
   * Stable shot or resident owner, unique among simultaneously live scopes.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Identifies each live resource scope without using runtime UUID spelling.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps scope attribution stable across hosts.
   */
  owner: string;

  /**
   * Authored PBR material records consumed by this scope.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the material channels selecting resident upload variants.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Resolves binding costs inside their actual live scope.
   */
  materials: readonly IAutoMovieMaterial[];

  /**
   * Actual source facts from this scope's cache, keyed by asset within it.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries actual decode and upload representations for live textures.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prevents another shot's independently decoded source from overwriting this one.
   */
  sources: readonly IAutoMovieRenderTextureSource[];

  /**
   * Declared environment asset, or null when no image is consumed.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes image lighting and background consumers in resident closure.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves absence of an image independently of decoded source availability.
   */
  environment: string | null;

  /**
   * Facts from the actual environment texture object, including its clone
   * identity. A cache's original texture is not this environment clone.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Identifies the actual object owning cached environment derivatives.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates environment clone identity from shared source identity.
   */
  environmentTexture?: IAutoMovieRenderTextureSource;

  /**
   * Whether drawn default materials also use the shared PBR lookup.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes renderer lookup storage for untextured default PBR materials.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes default PBR consumers from non-PBR shaders.
   */
  defaultPbr?: boolean;
}
