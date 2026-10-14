/**
 * Only a dialog-target click strictly beyond its native rectangle dismisses. Exact edges and descendant controls belong to the dialog, including padding; coordinates and bounds must use the same native client frame.
 *
 * @evidence contracts/common.md#principled-implementation Strict rectangle inequalities distinguish backdrop from dialog edges after confirming the actual target is the dialog itself; the native adapter supplies client coordinates and its current DOMRect.
 * @evidence contracts/common.md#clear-and-simple-design The pure geometric decision is independent of modal close effects and layout acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No padding estimate, timeout or target-name heuristic substitutes for native target and bounds observations.
 * @evidence contracts/common.md#meaningful-documentation The comment states strict edge handling and the shared coordinate-frame premise.
 * @evidence contracts/performance.md#efficient-algorithms A fixed target check and four comparisons cost constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each click uses current layout bounds rather than caching a rectangle across layout changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains no event, rectangle or DOM reference.
 */
export function isGalleryBackdropOutside(input: {
  dialogTarget: boolean;
  x: number;
  y: number;
  bounds: { left: number; right: number; top: number; bottom: number };
}): boolean {
  if (!input.dialogTarget) return false;
  return (
    input.x < input.bounds.left ||
    input.x > input.bounds.right ||
    input.y < input.bounds.top ||
    input.y > input.bounds.bottom
  );
}
