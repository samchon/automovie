/**
 * Borrowed canvas operations for 2D render/photograph composition and observed landmarks. Save and restore isolate each layer's alpha and clipping; the shared layout owns all capture-pixel geometry.
 *
 * @evidence contracts/common.md#principled-implementation Canvas state, path and image methods expose the standard 2D operations used by per-layer alpha composition and landmark drawing.
 * @evidence contracts/common.md#clear-and-simple-design The renderer receives only operations its composition needs, not a replacement DOM or Canvas implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The surface is borrowed from the caller and no global Canvas method is replaced.
 * @evidence contracts/common.md#meaningful-documentation Save and restore isolate layer alpha and clipping; coordinates and extents are capture pixels.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Canvas state, path and image methods expose the standard 2D operations used by per-layer alpha composition and landmark drawing.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The surface is borrowed from the caller and no global Canvas method is replaced.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceContext {
  /**
   * Unit-range opacity applied to the current layer; save and restore isolate it from other layers.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Applies only the current 2D layer's unit-range opacity while save/restore protect its neighbours.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Applies only the current 2D layer's unit-range opacity while save/restore protect its neighbours.
   */
  globalAlpha: number;

  /**
   * Canvas fill style used for the final landmark paths.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Selects the canvas style for observed landmark paths without changing numerical surface materials.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Selects the canvas style for observed landmark paths without changing numerical surface materials.
   */
  fillStyle: unknown;

  /**
   * Save alpha, style and clipping state before drawing one layer.
   *
   * @evidence contracts/common.md#principled-implementation Canvas drawing state is saved before one composition layer changes alpha or clipping.
   * @evidence contracts/common.md#clear-and-simple-design The supported canvas stack owns state isolation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied surface operation is used without replacing Canvas globals.
   * @evidence contracts/common.md#meaningful-documentation The current alpha, style and clipping state are pushed for the matching restore.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Canvas drawing state is saved before one composition layer changes alpha or clipping.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The current alpha, style and clipping state are pushed for the matching restore.
   */
  save(): void;

  /**
   * Restore the matching saved state after drawing that layer.
   *
   * @evidence contracts/common.md#principled-implementation The previous canvas state is restored after the composition layer is drawn.
   * @evidence contracts/common.md#clear-and-simple-design One matching stack operation prevents layer state from leaking.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The call delegates standard Canvas state restoration rather than manually patching a context.
   * @evidence contracts/common.md#meaningful-documentation The matching saved alpha, style and clipping state becomes current again.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The previous canvas state is restored after the composition layer is drawn.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The matching saved alpha, style and clipping state becomes current again.
   */
  restore(): void;

  /**
   * Start a fresh clipping or marker path without retaining previous path segments.
   *
   * @evidence contracts/common.md#principled-implementation A new canvas path isolates each clipping rectangle or landmark circle.
   * @evidence contracts/common.md#clear-and-simple-design The surface owns path state while layout owns geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation starts a path on the borrowed canvas without special-casing an image.
   * @evidence contracts/common.md#meaningful-documentation Previous path segments are discarded before the next rect or arc is authored.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach A new canvas path isolates each clipping rectangle or landmark circle.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Previous path segments are discarded before the next rect or arc is authored.
   */
  beginPath(): void;

  /**
   * Append a rectangular path in capture pixels; x and y locate its top-left corner.
   *
   * @evidence contracts/common.md#principled-implementation A capture-pixel rectangle defines one supplied clipping window.
   * @evidence contracts/common.md#clear-and-simple-design Only rectangle path construction is exposed; layout chooses its extent.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The coordinates come from the current layout rather than a photograph-specific mask.
   * @evidence contracts/common.md#meaningful-documentation x and y locate the top-left corner; w and h are pixel extents.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach A capture-pixel rectangle defines one supplied clipping window.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach x and y locate the top-left corner; w and h are pixel extents.
   */
  rect(x: number, y: number, w: number, h: number): void;

  /**
   * Apply the current path to the canvas clipping region for subsequent layer drawing.
   *
   * @evidence contracts/common.md#principled-implementation The current layer's authored path restricts its visible canvas window.
   * @evidence contracts/common.md#clear-and-simple-design Clipping is a standard surface operation isolated by save and restore.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No numerical geometry or product camera is altered by 2D reference clipping.
   * @evidence contracts/common.md#meaningful-documentation The current path updates the canvas clipping region for subsequent drawing.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The current layer's authored path restricts its visible canvas window.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The current path updates the canvas clipping region for subsequent drawing.
   */
  clip(): void;

  /**
   * Append a circular path with pixel centre and radius and radian start/end angles.
   *
   * @evidence contracts/common.md#principled-implementation A circle path places an observed landmark at its projected capture-pixel centre.
   * @evidence contracts/common.md#clear-and-simple-design The context draws the path while the shared layout supplies marker positions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed circles do not fit or alter anatomical geometry.
   * @evidence contracts/common.md#meaningful-documentation Centre and radius are pixels; from and to are canvas arc angles in radians.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach A circle path places an observed landmark at its projected capture-pixel centre.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Centre and radius are pixels; from and to are canvas arc angles in radians.
   */
  arc(x: number, y: number, r: number, from: number, to: number): void;

  /**
   * Fill the current path with the selected fillStyle.
   *
   * @evidence contracts/common.md#principled-implementation The current marker path is filled using the caller-selected canvas style.
   * @evidence contracts/common.md#clear-and-simple-design The surface applies its standard fill operation without owning marker geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The call paints only the authored path, without replacing renderer or model values.
   * @evidence contracts/common.md#meaningful-documentation The current fillStyle is used for the most recently started path.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The current marker path is filled using the caller-selected canvas style.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The current fillStyle is used for the most recently started path.
   */
  fill(): void;

  /**
   * Draw the supplied image or render canvas into its destination rectangle in capture pixels.
   *
   * @evidence contracts/common.md#principled-implementation The supplied rendered canvas or decoded photograph is drawn into its layout rectangle.
   * @evidence contracts/common.md#clear-and-simple-design Source selection and fitting stay with the reference layout owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual supplied image is drawn without generating replacement source content.
   * @evidence contracts/common.md#meaningful-documentation x, y, w and h specify the destination rectangle in capture pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The supplied rendered canvas or decoded photograph is drawn into its layout rectangle.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach x, y, w and h specify the destination rectangle in capture pixels.
   */
  drawImage(image: unknown, x: number, y: number, w: number, h: number): void;
}
