import type { IAutoMovieSectionRenderer } from "@automovie/render";
import type * as THREE from "three";

/**
 * What the inspector's scene mount takes from the page: a renderer, the animation-frame clock and the canvas size.
 *
 * `createAutoMovieInspectorCanvasHost` gives the browser's: a `WebGLRenderer` on the canvas, `requestAnimationFrame` and the canvas's layout size. A unit test gives recording doubles, so the mount's lifecycle runs without a browser.
 *
 * @evidence contracts/development/design.md#principled-representation The three things a render loop needs from its platform: a drawing surface, a frame clock in milliseconds and the drawing size in CSS pixels with the device pixel ratio.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the viewer and read only by `mountAutoMovieInspectorScene`; the renderer is the structural subset of `THREE.WebGLRenderer` the mount calls, extending render's own section-renderer seam.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Structural rather than `THREE.WebGLRenderer`, because demanding the whole renderer would put a live WebGL context between the lifecycle and any check of it; the real renderer satisfies it as it stands.
 * @evidence contracts/development/common.md#meaningful-documentation States who supplies it in a page and in a test, and what each member is.
 */
export interface IAutoMovieInspectorSceneHost {
  /**
   * Create the renderer one mount draws with; the mount disposes it when it ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ownership of the result.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The mount owns the renderer and calls its `dispose` once.
   */
  createRenderer(): IAutoMovieInspectorSceneHost.IRenderer;

  /**
   * Run `callback` once before the next repaint with the frame's time in milliseconds, and return a handle `cancelFrame` takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the handle.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The mount holds at most one pending handle and cancels it when it ends.
   */
  requestFrame(callback: (nowMs: number) => void): number;

  /**
   * Cancel a pending frame so its callback never runs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the effect.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the host that implements it answers.
   */
  cancelFrame(handle: number): void;

  /**
   * The size to draw at now: CSS pixels of the drawing area and the device pixel ratio.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the host that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the host that implements it answers.
   */
  size(): IAutoMovieInspectorSceneHost.ISize;
}
export namespace IAutoMovieInspectorSceneHost {
  /**
   * The part of `THREE.WebGLRenderer` the inspector's mount calls.
   *
   * @evidence contracts/development/design.md#principled-representation Drawing, sizing, release and the section clipping switch, with three.js's own signatures, so the real renderer is assignable as it is.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four methods and the inherited switch, each called by the mount.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No context or capability member, so a recording double needs no WebGL.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member is for.
   */
  export interface IRenderer extends IAutoMovieSectionRenderer {
    /**
     * Draw a scene through a camera into the canvas.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the effect.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources three.js's own method.
     */
    render(scene: THREE.Object3D, camera: THREE.Camera): void;

    /**
     * Set the device pixel ratio the drawing buffer is scaled by.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the effect.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources three.js's own method.
     */
    setPixelRatio(ratio: number): void;

    /**
     * Size the drawing buffer in CSS pixels; `updateStyle` false leaves the canvas's layout to the page.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the unit and the style switch.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources three.js's own method.
     */
    setSize(width: number, height: number, updateStyle?: boolean): void;

    /**
     * Release the renderer's GPU resources. The context is not lost, so a later renderer on the same canvas draws.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what is released and what is kept.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work three.js's own method.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources three.js's own method.
     */
    dispose(): void;
  }

  /**
   * The drawing size the host reports.
   *
   * @evidence contracts/development/design.md#principled-representation CSS pixels and a device pixel ratio, the two numbers a WebGL drawing buffer is sized from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three numbers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts That they are positive and finite is checked by the mount, which skips a frame otherwise.
   * @evidence contracts/development/common.md#meaningful-documentation States each unit.
   */
  export interface ISize {
    /** Drawing width, CSS pixels. */
    width: number;

    /** Drawing height, CSS pixels. */
    height: number;

    /** Device pixels per CSS pixel. */
    pixelRatio: number;
  }
}
