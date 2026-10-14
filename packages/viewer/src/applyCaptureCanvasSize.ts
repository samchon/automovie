
/**
 * Pin a capture canvas to an exact pixel size, so a headless screenshot of it
 * is the requested frame size regardless of the host browser window.
 *
 * Without this the capture canvas is CSS `100vw/100vh`, so `#view`'s rendered
 * (and screenshotted) size is whatever viewport the host happened to open,
 * making the encoded aspect a convention the pose-keypoint sidecar's
 * `width/height` aspect (#1231) could not rely on. The render plan now pins the
 * encoded size with ffmpeg `-s` (#1251); pinning the CANVAS to the same
 * `width`/`height` here means that `-s` re-encodes an already-correct frame
 * instead of rescaling a wrong-aspect capture. A non-positive or non-finite
 * dimension is ignored, so interactive viewing (no capture dimensions) keeps
 * the responsive CSS size.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Sets CSS width/height in pixels together only when both dimensions are finite and positive, matching the renderer/capture host's requested raster aspect; it does not set the canvas backing store or override devicePixelRatio.
 * @evidence contracts/common.md#clear-and-simple-design This DOM adapter owns only capture element sizing; renderer backing-buffer sizing and video encoding stay with their existing hosts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid/omitted interactive capture dimensions preserve responsive CSS by contract; no browser identity, screenshot fixture or foreign method is substituted.
 * @evidence contracts/common.md#meaningful-documentation Documents CSS pixel sizing, finite-positive admission and the responsive no-op; backing-store sizing remains a separate renderer obligation.
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
