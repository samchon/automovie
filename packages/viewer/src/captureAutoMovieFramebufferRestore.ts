import * as THREE from "three";

import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Capture the public framebuffer selection and raster rectangle state.
 * A target bind changes effective viewport/scissor. Preserve both configured
 * logical renderer fields and the effective framebuffer's physical rectangle.
 * A temporary target rectangle supplies the captured physical values to the
 * supported bind operation, then its authored fields are restored immediately.
 * Every independent restoration is attempted after a native resource operation.
 *
 * @evidence contracts/common.md#principled-implementation Captures native target/cube-face/mip plus logical viewport/scissor/test and current framebuffer rectangles, then restores through public setters/bind with a temporary target rectangle handoff; renderer/context must still be alive and supported native state APIs must describe the same draw target, with default-framebuffer state relying on native null-bind behavior.
 * @evidence contracts/common.md#clear-and-simple-design Owns one reversible framebuffer snapshot separate from pass materials; temporary target field mutation exists only because native setRenderTarget consumes that target's authored raster state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses queried actual framebuffer rectangles instead of fixture canvas dimensions or renderer-internal replacements; target's original fields are independently restored even when rebinding throws, preserving the original cause.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes logical versus effective physical rectangles, target handoff and independent restoration after native operations rather than claiming a target-only snapshot is complete.
 * @evidence contracts/performance.md#efficient-algorithms Performs fixed-count native state reads/vector copies and fixed restore operations, constant coordinator storage; WebGL getParameter may synchronize with the driver and is a snapshot boundary cost rather than per-pixel work.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned closer reuses one captured state for its owner scope; each actual snapshot requires fresh target/rectangle observations and repeated restore is not memoized by this primitive.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds borrowed renderer/target plus four-vector/scalar snapshot state through closer lifetime and acquires no render target itself; target/renderer owners must keep resources alive until restore and then release the closer.
 */
export const captureAutoMovieFramebufferRestore: (
  renderer: THREE.WebGLRenderer,
) => () => void = (renderer: THREE.WebGLRenderer): (() => void) => {
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
  const gl: WebGLRenderingContext | WebGL2RenderingContext =
    renderer.getContext();
  const effectiveScissor: THREE.Vector4 = new THREE.Vector4().fromArray(
    gl.getParameter(gl.SCISSOR_BOX) as Int32Array,
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
