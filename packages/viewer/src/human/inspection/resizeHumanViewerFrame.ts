/**
 * Keep the CSS viewport and its camera projection paired for every capture. The resident stage's resize observer owns renderer sizing and camera aspect; resizing only the shared renderer would preserve a previous stage's aspect. The caller runs this before fitting and choosing the observation camera.
 *
 * @evidence contracts/common.md#principled-implementation Updates display and canvas CSS dimensions together, then invokes the owning stage resize callback so renderer size and camera aspect follow the same requested frame.
 * @evidence contracts/common.md#clear-and-simple-design The adapter only pairs the two CSS surfaces; the stage retains projection and renderer resize responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not resize the shared renderer behind the stage or add camera fitting offsets; the caller supplies an already admitted size.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies paired viewport/projection ownership and the required resize-before-fitting order.
 * @evidence contracts/performance.md#efficient-algorithms Four style assignments and one callback are fixed adapter work; actual renderer sizing cost remains with the stage.
 * @evidence contracts/performance.md#reuse-equivalent-work Resize is an effect on current surfaces and no completed resize is reused merely because a previous size matched.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Both surfaces and the callback are borrowed; the function creates no observer or renderer and retains nothing after the call.
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
