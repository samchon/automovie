import type * as THREE from "three";
import { type IAutoMovieSemanticMaskBinding } from "@automovie/interface";
import { attachAutoMovieSemanticMask as attachAutoMovieSemanticMaskImplementation } from "./internal/attachAutoMovieSemanticMask.js";
import { autoMovieSemanticMaskOf as autoMovieSemanticMaskOfImplementation } from "./internal/autoMovieSemanticMaskOf.js";

/** Public operations for Auto Movie Render Semantic Mask. */
export namespace AutoMovieRenderSemanticMask {
  /**
   * Hand a built scene the palette its `mask` pass must paint it with.
   *
   * The scene carries it, rather than every caller passing it down, for the same
   * reason a formation's baked cycle rides on its own mesh: the pass boundary
   * that needs it is several calls below whoever knows it. A compiled shot's
   * runtime hands `applyRenderMode` a pass name and nothing else, so a mask that
   * had to arrive as an argument could only arrive by widening every signature
   * between the page and the pass. A scene given no palette keeps the legacy
   * index ramp, which is what an asset turntable and any host without a compiled
   * design draw.
   */
  export function attach(scene: THREE.Scene, binding: IAutoMovieSemanticMaskBinding): void {
    attachAutoMovieSemanticMaskImplementation(scene, binding);
  }

  /** The palette a scene was given, or `null` when it was given none. */
  export function of(scene: THREE.Scene): IAutoMovieSemanticMaskBinding | null {
    return autoMovieSemanticMaskOfImplementation(scene);
  }
}
