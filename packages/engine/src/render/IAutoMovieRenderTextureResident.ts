import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One live shot's texture consumers in a shared graphics context. The capture
 * host supplies actual decoded objects and excludes disposed shots; authors
 * supply materials and environment declarations, never GPU identity tokens.
 *
 *
 * @evidence contracts/common.md#principled-implementation Describe one live scope's material/environment consumers with actual decoded sources and shadow/area-light facts; missing facts leave reused-context requirements uncertified.
 * @evidence contracts/common.md#clear-and-simple-design Scope ownership separates identical asset ids decoded in different caches and environment clones from the same source image.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authors provide material declarations while hosts provide object/upload facts; no synthetic GPU identity or byte count substitutes for observation.
 * @evidence contracts/common.md#meaningful-documentation Members give owner uniqueness, actual cache/environment-clone distinction, optional default PBR and missing shadow/light fact meanings.
 * @evidence contracts/performance.md#efficient-algorithms Storage scales with material/source facts rather than pixels; closure work scans each scope's required slots and groups equivalent uploads.
 * @evidence contracts/performance.md#reuse-equivalent-work A resident's unchanged actual sources can share uploads with matching identity/state in other live scopes; equal asset names alone do not prove sharing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The capture host excludes disposed shots and owns cache/context disposal; this borrowed record does not retain native textures independently.
 * @author Samchon
 */
export interface IAutoMovieRenderTextureResident {
  /**
   * Other live scope's required shadow map/filter roles from the shared policy
   * resolver. An empty list states no casters; omission leaves that scope's
   * shadow storage unreported and cannot certify a reused context.
   */
  shadowCasters?: readonly { light: string; filterDraws: number }[];

  /**
   * Whether this live scope declares rectangular lights. Missing lighting
   * facts cannot certify the lookup closure of its physically based surfaces.
   */
  areaLights?: boolean;

  /** Stable shot or resident owner, unique among simultaneously live scopes. */
  owner: string;

  /** Authored PBR material records consumed by this scope. */
  materials: readonly IAutoMovieMaterial[];

  /** Actual source facts from this scope's cache, keyed by asset within it. */
  sources: readonly IAutoMovieRenderTextureSource[];

  /** Declared environment asset, or null when no image is consumed. */
  environment: string | null;

  /**
   * Facts from the actual environment texture object, including its clone
   * identity. A cache's original texture is not this environment clone.
   */
  environmentTexture?: IAutoMovieRenderTextureSource;

  /** Whether drawn default materials also use the shared PBR lookup. */
  defaultPbr?: boolean;
}
