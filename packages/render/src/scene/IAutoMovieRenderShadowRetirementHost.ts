import type * as THREE from "three";
import type { IAutoMovieRenderShadowRetirement } from "./IAutoMovieRenderShadowRetirement";

/**
 * A renderer as its shadow retirement guard sees it: the record of a pending or
 * failed shadow retirement lives on the renderer it belongs to, so every scene
 * and budget read through the same renderer meets the same record.
 * `guardSceneShadowRetirement` alone writes and clears the field.
 */
export interface IAutoMovieRenderShadowRetirementHost {
  /** The renderer's shadow switch, which every renderer this guards carries. */
  shadowMap: Pick<THREE.WebGLRenderer["shadowMap"], "enabled">;

  /** The pending or failed retirement; absent when none is outstanding. */
  autoMovieShadowRetirement?: IAutoMovieRenderShadowRetirement;
}
