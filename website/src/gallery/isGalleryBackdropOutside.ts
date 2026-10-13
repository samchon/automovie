/**
 * Only the dialog-target click strictly beyond its native rectangle dismisses.
 * Exact edges and descendant controls belong to the dialog, including padding.
 */
export function isGalleryBackdropOutside(input: {
  dialogTarget: boolean;
  x: number; y: number;
  bounds: { left: number; right: number; top: number; bottom: number };
}): boolean {
  if (!input.dialogTarget) return false;
  return input.x < input.bounds.left || input.x > input.bounds.right ||
    input.y < input.bounds.top || input.y > input.bounds.bottom;
}
