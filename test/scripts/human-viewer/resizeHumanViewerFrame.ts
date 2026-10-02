/**
 * Keep the CSS viewport and its camera projection paired for every capture.
 * The resident stage's resize observer owns renderer sizing and camera aspect;
 * resizing only the shared renderer would preserve a previous stage's aspect.
 * The caller runs this before fitting and choosing the observation camera.
 *
 * @evidence contracts/common.md#principled-implementation The resident observer reads the same square CSS extent that defines the capture, keeping camera aspect paired with the renderer.
 * @evidence contracts/common.md#clear-and-simple-design One operation orders the display dimensions before the stage-owned resize callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the viewport's supported resize observer without mutating camera internals or recognizing documents.
 * @evidence contracts/common.md#meaningful-documentation Explains pixel extent, observer ownership and why buffer resizing alone is insufficient.
 */
export function resizeHumanViewerFrame(
  size: number,
  display: { style: { width: string; height: string } },
  canvas: { style: { width: string; height: string } },
  resize: () => void,
): void {
  display.style.width = `${size}px`;
  display.style.height = `${size}px`;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  resize();
}
