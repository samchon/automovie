import type * as THREE from "three";

import type { IAutoMovieFramebufferRenderer } from "./IAutoMovieFramebufferRenderer.js";
import type { IAutoMovieShadowRetirementHost } from "./IAutoMovieShadowRetirementHost.js";

/**
 * The part of a `THREE.WebGLRenderer` one scene pass uses: drawing, tone
 * mapping and the shadow map it sets for the pass and restores after, and the
 * framebuffer access a retired cube shadow depth needs.
 */
export type IAutoMovieScenePassRenderer = Pick<
  THREE.WebGLRenderer,
  "render" | "shadowMap" | "toneMapping" | "toneMappingExposure"
> &
  IAutoMovieFramebufferRenderer &
  IAutoMovieShadowRetirementHost;
