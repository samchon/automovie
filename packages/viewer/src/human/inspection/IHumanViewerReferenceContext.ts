/**
 * Borrowed canvas operations for 2D render/photograph composition and observed landmarks. Save and restore isolate each layer's alpha and clipping; the shared layout owns all capture-pixel geometry.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceContext {
  /**
   * Unit-range opacity applied to the current layer; save and restore isolate it from other layers.
   */
  globalAlpha: number;

  /** Canvas fill style used for the final landmark paths. */
  fillStyle: unknown;

  /** Save alpha, style and clipping state before drawing one layer. */
  save(): void;

  /** Restore the matching saved state after drawing that layer. */
  restore(): void;

  /**
   * Start a fresh clipping or marker path without retaining previous path segments.
   */
  beginPath(): void;

  /**
   * Append a rectangular path in capture pixels; x and y locate its top-left corner.
   */
  rect(x: number, y: number, w: number, h: number): void;

  /**
   * Apply the current path to the canvas clipping region for subsequent layer drawing.
   */
  clip(): void;

  /**
   * Append a circular path with pixel centre and radius and radian start/end angles.
   */
  arc(x: number, y: number, r: number, from: number, to: number): void;

  /** Fill the current path with the selected fillStyle. */
  fill(): void;

  /**
   * Draw the supplied image or render canvas into its destination rectangle in capture pixels.
   */
  drawImage(image: unknown, x: number, y: number, w: number, h: number): void;
}
