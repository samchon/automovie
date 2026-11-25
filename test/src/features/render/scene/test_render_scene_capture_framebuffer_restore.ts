import {
  type IAutoMovieFramebufferContext,
  type IAutoMovieFramebufferRenderer,
  captureAutoMovieFramebufferRestore,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { throws } from "node:assert/strict";
import { Vector4, type Vector4Tuple, WebGLRenderTarget } from "three";

/**
 * A framebuffer restore rebinds the captured subresource with its effective
 * rectangle and returns the target's authored fields after the bind.
 *
 * Scenarios:
 *
 * 1. Capture reads distinct logical and physical scissor and viewport values.
 * 2. Restoration writes the logical fields first, then hands the captured physical
 *    values to the native bind.
 * 3. After a failed bind the original cause escapes and the texture target keeps
 *    its authored settings.
 *
 * The typed host port records exact integer raster rectangles and indices.
 * Actual framebuffer completeness and native drawing use a browser host.
 */
export function test_render_scene_capture_framebuffer_restore(): void {
  const target: WebGLRenderTarget = new WebGLRenderTarget(128, 128);
  target.viewport.set(20, 21, 22, 23);
  target.scissor.set(30, 31, 32, 33);
  target.scissorTest = false;

  const unavailable: () => never = (): never => {
    throw new Error("Unexpected native framebuffer access");
  };
  const context: IAutoMovieFramebufferContext = {
    SCISSOR_BOX: 0x0c10,
    SCISSOR_TEST: 0x0c11,
    FRAMEBUFFER: 0x8d40,
    DEPTH_ATTACHMENT: 0x8d00,
    FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 0x8cd0,
    FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8cd1,
    TEXTURE: 0x1702,
    getParameter: (name: number): Int32Array =>
      name === 0x0c10 ? new Int32Array([40, 41, 42, 43]) : unavailable(),
    isEnabled: (name: number): boolean =>
      name === 0x0c11 ? true : unavailable(),
    getFramebufferAttachmentParameter: unavailable,
    isTexture: unavailable,
    deleteTexture: unavailable,
  };
  const calls: string[] = [];
  const failure: Error = new Error("The selected target could not be rebound");
  let failBinding: boolean = false;
  const renderer: IAutoMovieFramebufferRenderer = {
    getRenderTarget: (): WebGLRenderTarget => target,
    getActiveCubeFace: (): number => 3,
    getActiveMipmapLevel: (): number => 2,
    getViewport: (out: Vector4): Vector4 => out.set(1, 2, 3, 4),
    getScissor: (out: Vector4): Vector4 => out.set(5, 6, 7, 8),
    getScissorTest: (): boolean => false,
    getCurrentViewport: (out: Vector4): Vector4 => out.set(9, 10, 11, 12),
    getContext: (): IAutoMovieFramebufferContext => context,
    setViewport: (
      rect: Vector4 | number,
      y?: number,
      width?: number,
      height?: number,
    ): void => {
      calls.push("viewport");
      const measured: Vector4 | number =
        y === undefined ? rect : new Vector4(Number(rect), y, width, height);
      TestValidator.equals(
        "logical viewport",
        measured,
        new Vector4(1, 2, 3, 4),
      );
    },
    setScissor: (
      rect: Vector4 | number,
      y?: number,
      width?: number,
      height?: number,
    ): void => {
      calls.push("scissor");
      const measured: Vector4 | number =
        y === undefined ? rect : new Vector4(Number(rect), y, width, height);
      TestValidator.equals(
        "logical scissor",
        measured,
        new Vector4(5, 6, 7, 8),
      );
    },
    setScissorTest: (enabled: boolean): void => {
      calls.push("test");
      TestValidator.equals("logical scissor enablement", enabled, false);
    },
    setRenderTarget: (
      selected: WebGLRenderTarget | null,
      face?: number,
      mip?: number,
    ): void => {
      calls.push("bind");
      TestValidator.predicate("same native target", selected === target);
      TestValidator.equals("selected subresource", [face, mip], [3, 2]);
      TestValidator.equals(
        "physical viewport and scissor at bind",
        {
          viewport: target.viewport.toArray(),
          scissor: target.scissor.toArray(),
          test: target.scissorTest,
        },
        { viewport: [9, 10, 11, 12], scissor: [40, 41, 42, 43], test: true },
      );
      if (failBinding) throw failure;
    },
    resetState: unavailable,
  };

  const restore: () => void = captureAutoMovieFramebufferRestore(renderer);
  TestValidator.equals("capture does not call setters", calls, []);
  restore();
  TestValidator.equals("logical registers precede rebind", calls, [
    "viewport",
    "scissor",
    "test",
    "bind",
  ]);
  const authored: {
    viewport: Vector4Tuple;
    scissor: Vector4Tuple;
    test: boolean;
  } = {
    viewport: [20, 21, 22, 23],
    scissor: [30, 31, 32, 33],
    test: false,
  };
  TestValidator.equals(
    "successful bind returns the authored target state",
    {
      viewport: target.viewport.toArray(),
      scissor: target.scissor.toArray(),
      test: target.scissorTest,
    },
    authored,
  );

  failBinding = true;
  throws(restore, (error: unknown): boolean => error === failure);
  TestValidator.equals(
    "failed bind returns the authored target state",
    {
      viewport: target.viewport.toArray(),
      scissor: target.scissor.toArray(),
      test: target.scissorTest,
    },
    authored,
  );
}
