import * as THREE from "three";

import type { IAutoMovieFramebufferContext } from "../IAutoMovieFramebufferContext.js";
import type { IAutoMovieFramebufferRenderer } from "../IAutoMovieFramebufferRenderer.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/*
 * Capture the public framebuffer selection and raster rectangle state. A target
 * bind changes effective viewport/scissor. Preserve both configured logical
 * renderer fields and the effective framebuffer's physical rectangle. A
 * temporary target rectangle supplies the captured physical values to the
 * supported bind operation, then its authored fields are restored immediately.
 * Every independent restoration is attempted after a native resource
 * operation.
 */
export const captureAutoMovieFramebufferRestore: (
  renderer: IAutoMovieFramebufferRenderer,
) => () => void = (renderer: IAutoMovieFramebufferRenderer): (() => void) => {
  const target: THREE.WebGLRenderTarget<
      THREE.Texture<unknown, THREE.TextureEventMap>
    > | null = renderer.getRenderTarget(),
    face: number = renderer.getActiveCubeFace(),
    mip: number = renderer.getActiveMipmapLevel();
  const viewport: THREE.Vector4 = renderer.getViewport(new THREE.Vector4()),
    scissor: THREE.Vector4 = renderer.getScissor(new THREE.Vector4()),
    test: boolean = renderer.getScissorTest();
  const effectiveViewport: THREE.Vector4 = renderer.getCurrentViewport(
    new THREE.Vector4(),
  );
  const gl: IAutoMovieFramebufferContext = renderer.getContext();
  const effectiveScissor: THREE.Vector4 = new THREE.Vector4().fromArray(
    gl.getParameter(gl.SCISSOR_BOX),
  );
  const effectiveTest: boolean = gl.isEnabled(gl.SCISSOR_TEST);
  return (): void =>
    restoreAutoMovieRenderModeState([
      (): void => {
        renderer.setViewport(viewport);
      },
      (): void => {
        renderer.setScissor(scissor);
      },
      (): void => {
        renderer.setScissorTest(test);
      },
      (): void => {
        if (target === null) {
          renderer.setRenderTarget(null, face, mip);
          return;
        }
        const priorViewport: THREE.Vector4 = target.viewport.clone(),
          priorScissor: THREE.Vector4 = target.scissor.clone(),
          priorTest: boolean = target.scissorTest;
        target.viewport.copy(effectiveViewport);
        target.scissor.copy(effectiveScissor);
        target.scissorTest = effectiveTest;
        let failure: { error: unknown } | undefined;
        try {
          renderer.setRenderTarget(target, face, mip);
        } catch (error) {
          failure = { error };
        }
        const restore: (() => void)[] = [
          (): void => {
            target.viewport.copy(priorViewport);
          },
          (): void => {
            target.scissor.copy(priorScissor);
          },
          (): void => {
            target.scissorTest = priorTest;
          },
        ];
        if (failure === undefined) restoreAutoMovieRenderModeState(restore);
        else restoreAutoMovieRenderModeState(restore, failure);
      },
    ]);
};
