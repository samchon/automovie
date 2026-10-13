/**
 * Keep the CSS viewport and its camera projection paired for every capture.
 * The resident stage's resize observer owns renderer sizing and camera aspect;
 * resizing only the shared renderer would preserve a previous stage's aspect.
 * The caller runs this before fitting and choosing the observation camera.
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
