
/**
 * Set a capture canvas's CSS width and height to the supplied finite positive dimensions. Invalid dimensions leave both current styles unchanged, allowing an untouched interactive canvas to keep its responsive CSS. This adapter does not set the backing raster, device pixel ratio, screenshot bounds or encoded video size; the rendering and capture hosts own their agreement with these CSS dimensions.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Sets CSS width/height in pixels together only when both dimensions are finite and positive, matching the renderer/capture host's requested raster aspect; it does not set the canvas backing store or override devicePixelRatio.
 * @evidence contracts/common.md#clear-and-simple-design This DOM adapter owns only capture element sizing; renderer backing-buffer sizing and video encoding stay with their existing hosts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid dimensions preserve current styles rather than clearing a previous fixed size or inventing a fallback; no browser identity, screenshot fixture or foreign method is substituted.
 * @evidence contracts/common.md#meaningful-documentation Documents CSS pixel sizing, finite-positive admission and unchanged styles on refusal; backing-store sizing remains a separate renderer obligation.
 * @evidence contracts/performance.md#efficient-algorithms Performs two finite-positive checks and at most two style writes, with constant time and temporary string storage independent of frame pixel count.
 * @evidence contracts/performance.md#reuse-equivalent-work Creates no derived raster or cache; repeated writes target the same mutable DOM style and have no stored equivalence key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the canvas during the call and retains no DOM reference, observer, renderer or task; installed CSS values remain owned by the host element.
 */
export const applyCaptureCanvasSize: (canvas: HTMLCanvasElement, width: number, height: number) => void = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): void => {
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0
  )
    return;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};
