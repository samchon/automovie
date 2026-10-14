/**
 * Borrowed canvas operations for 2D render/photograph composition and observed landmarks. Save and restore isolate each layer's alpha and clipping; the shared layout owns all capture-pixel geometry.
 *
 * @evidence contracts/common.md#principled-implementation A structural subset of canvas drawing operations supports image layers and circular landmarks; the browser canvas supplies their semantics.
 * @evidence contracts/common.md#clear-and-simple-design The drawing seam exposes only operations called by reference composition, leaving canvas creation and image decoding to the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Borrowed canvas operations are invoked directly; the interface neither replaces browser methods nor includes fixture-specific drawing commands.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify opacity isolation, capture-pixel geometry, radian arc angles and the borrowed image and clipping operations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The canvas contract declares drawing signatures without choosing rasterization algorithms or allocating pixel buffers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Layer drawing is effectful on a borrowed surface; the interface introduces no deduplication or shared rendering results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the canvas; paired save and restore delimit temporary layer state, while image ownership remains outside this interface.
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

  /**
   * Save alpha, style and clipping state before drawing one layer.
   *
   * @evidence contracts/common.md#principled-implementation Canvas state stacking preserves the alpha, style and clip that existed before a reference layer draws.
   * @evidence contracts/common.md#clear-and-simple-design The borrowed save operation keeps temporary layer isolation beside its matching restore call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts State isolation uses the canvas API rather than replacing context properties with consumer-specific restoration.
   * @evidence contracts/common.md#meaningful-documentation The member comment states which temporary drawing state is saved before each layer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The save signature delegates stack implementation to canvas and selects no copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Saving drawing state is an ordered effect and cannot be shared across different layer boundaries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each saved canvas state requires the matching restore after its layer; the caller still owns the context.
   */
  save(): void;

  /**
   * Restore the matching saved state after drawing that layer.
   *
   * @evidence contracts/common.md#principled-implementation Restoring the canvas stack reinstates pre-layer clipping and alpha instead of reconstructing them from assumed defaults.
   * @evidence contracts/common.md#clear-and-simple-design The restore signature closes the state boundary opened by the composition's immediately preceding save.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Previous drawing state is restored through its owner API without an assumed universal alpha or clip rectangle.
   * @evidence contracts/common.md#meaningful-documentation The prose specifies that the matching saved layer state is restored after drawing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The restore operation declares a canvas capability rather than choosing how the native stack is stored.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A stack pop must occur at its own layer boundary; an earlier pop is not an equivalent reusable result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Restoration releases one saved state from the borrowed canvas stack without disposing the canvas itself.
   */
  restore(): void;

  /**
   * Start a fresh clipping or marker path without retaining previous path segments.
   *
   * @evidence contracts/common.md#principled-implementation A new canvas path separates the current clip rectangle or marker circle from previously accumulated path segments.
   * @evidence contracts/common.md#clear-and-simple-design The seam exposes one path-reset operation used directly before rectangular clips and circular landmarks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Path clearing follows native canvas semantics instead of clearing the whole image or inserting fixture-specific paths.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the fresh clipping or marker path and the absence of retained prior segments.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This path-reset signature neither chooses a path storage representation nor traverses image pixels.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resetting a mutable current path is effectful for each draw and has no transferable cached result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No external handle crosses this method; path memory remains managed by the borrowed canvas context.
   */
  beginPath(): void;

  /**
   * Append a rectangular path in capture pixels; x and y locate its top-left corner.
   *
   * @evidence contracts/common.md#principled-implementation Canvas rectangular paths express swipe windows directly in the same top-left capture-pixel frame as layout boxes.
   * @evidence contracts/common.md#clear-and-simple-design Four scalar arguments pass the shared clip rectangle without a second clipping representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Clipping geometry comes from layout dimensions, with no document-specific crop or measured-answer adjustment.
   * @evidence contracts/common.md#meaningful-documentation The member documents pixel units and the top-left meaning of the x and y coordinates.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The rectangle path signature delegates raster path construction to canvas rather than selecting a triangulation strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Appending a rectangle modifies the current path; repeated coordinates do not make separate path effects interchangeable.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rectangle call transfers no image or resource ownership; its path belongs to the context.
   */
  rect(x: number, y: number, w: number, h: number): void;

  /**
   * Apply the current path to the canvas clipping region for subsequent layer drawing.
   *
   * @evidence contracts/common.md#principled-implementation The native clipping intersection applies the current rectangular path to subsequent photograph drawing within a saved layer state.
   * @evidence contracts/common.md#clear-and-simple-design A parameterless clip operation consumes the path already prepared by beginPath and rect.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The viewer uses canvas clipping rather than masking selected fixture pixels or altering source photograph bytes.
   * @evidence contracts/common.md#meaningful-documentation Documentation states that the current path constrains subsequent layer drawing through the clipping region.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The clipping capability leaves region-intersection and pixel implementation choices to the canvas renderer.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Changing a context's clip is an ordered drawing effect rather than a result reusable across contexts.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The enclosing save/restore pair limits this clipping state to one layer of the caller-owned surface.
   */
  clip(): void;

  /**
   * Append a circular path with pixel centre and radius and radian start/end angles.
   *
   * @evidence contracts/common.md#principled-implementation Canvas circular arcs place observed landmark paths using pixel centres and radii with radian angles.
   * @evidence contracts/common.md#clear-and-simple-design The arc signature supplies only the geometry needed for the final full-circle landmark path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Circles are placed from observed marker coordinates without anatomical correction or subject-specific radii in this seam.
   * @evidence contracts/common.md#meaningful-documentation Its member comment distinguishes pixel centre/radius arguments from the radian start and end angles.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The arc declaration contains no curve subdivision or rasterization implementation to select.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Appending a circle affects the active path; one marker's draw does not substitute for another marker's path.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An arc retains no standalone geometry handle; the context owns its transient path representation.
   */
  arc(x: number, y: number, r: number, from: number, to: number): void;

  /**
   * Fill the current path with the selected fillStyle.
   *
   * @evidence contracts/common.md#principled-implementation Filling the current landmark path uses the canvas fillStyle selected by reference composition.
   * @evidence contracts/common.md#clear-and-simple-design A separate fill call completes a marker path without exposing unrelated stroke or image APIs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Landmark paint uses the actual context path and style instead of postprocessing expected marker pixels.
   * @evidence contracts/common.md#meaningful-documentation The comment states that the current path is filled with the selected fill style.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The fill signature defines no winding implementation or pixel traversal; the native canvas renderer owns both.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Painting modifies surface pixels and must occur for each marker, even when paths or styles match.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fill acquires no independently disposable object; destination pixels remain owned by the supplied surface.
   */
  fill(): void;

  /**
   * Draw the supplied image or render canvas into its destination rectangle in capture pixels.
   *
   * @evidence contracts/common.md#principled-implementation The borrowed draw-image operation scales a decoded photograph or render canvas into its computed capture-pixel destination.
   * @evidence contracts/common.md#clear-and-simple-design One image argument and one rectangle serve both supported reference layer sources.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Image objects are supplied by the actual capture caller rather than loaded from hardcoded subject assets inside drawing.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies the supplied image sources and the destination rectangle's capture-pixel coordinate system.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The image signature chooses no resampling kernel; raster scaling remains the browser canvas implementation's responsibility.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Drawing mutates the destination in layer order; identical image references alone cannot share these effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Image and render-canvas ownership stay with the caller; this operation borrows both for the synchronous draw.
   */
  drawImage(image: unknown, x: number, y: number, w: number, h: number): void;
}
