import type { IAutoMovieScenePassRenderer } from "@automovie/render";
import * as THREE from "three";

/**
 * A renderer for one scene pass that draws nothing: it keeps tone mapping and a
 * PCF shadow map enabled, draws into the canvas, and has no WebGL context, so a
 * framebuffer or native-depth call fails loudly instead of passing.
 */
export function createScenePassRendererDouble(
  render: () => void = (): void => {},
): IAutoMovieScenePassRenderer {
  const unavailable: () => never = (): never => {
    throw new Error("The scene pass renderer double has no WebGL context");
  };
  return {
    render,
    shadowMap: {
      enabled: true,
      autoUpdate: true,
      needsUpdate: false,
      type: THREE.PCFShadowMap,
      render: (): void => {},
    },
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
    getRenderTarget: (): null => null,
    setRenderTarget: unavailable,
    getActiveCubeFace: (): number => 0,
    getActiveMipmapLevel: (): number => 0,
    getViewport: unavailable,
    setViewport: unavailable,
    getScissor: unavailable,
    setScissor: unavailable,
    getScissorTest: unavailable,
    setScissorTest: unavailable,
    getCurrentViewport: unavailable,
    getContext: unavailable,
    resetState: unavailable,
  };
}
