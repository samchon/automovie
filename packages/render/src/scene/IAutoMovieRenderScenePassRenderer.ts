import type * as THREE from "three";

import type { IAutoMovieRenderFramebufferRenderer } from "./IAutoMovieRenderFramebufferRenderer";
import type { IAutoMovieRenderShadowRetirementHost } from "./IAutoMovieRenderShadowRetirementHost";

/**
 * The part of a `THREE.WebGLRenderer` one scene pass uses: drawing, tone
 * mapping and the shadow map it sets for the pass and restores after, and the
 * framebuffer access a retired cube shadow depth needs.
 */
export type IAutoMovieRenderScenePassRenderer = Pick<
  THREE.WebGLRenderer,
  "render" | "shadowMap" | "toneMapping" | "toneMappingExposure"
> &
  IAutoMovieRenderFramebufferRenderer &
  IAutoMovieRenderShadowRetirementHost;
