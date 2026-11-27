import type { IAutoMovieRenderFilmResponseRenderer } from "@automovie/render";
import * as THREE from "three";

/**
 * The renderer state a film response stage drives, held in plain fields, for
 * inspector renderer doubles whose subjects supply no optics and so never draw
 * through the stage.
 */
export function filmResponseRendererFields(): Omit<
  IAutoMovieRenderFilmResponseRenderer,
  "render"
> {
  let target: THREE.WebGLRenderTarget | null = null;
  return {
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
    autoClear: true,
    shadowMap: { autoUpdate: true },
    getRenderTarget: (): THREE.WebGLRenderTarget | null => target,
    setRenderTarget: (next: THREE.WebGLRenderTarget | null): void => {
      target = next;
    },
  };
}
