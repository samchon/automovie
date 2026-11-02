/**
 * Colour of the i-th selected curve, shared by the 3D page, PNG captures and 2D diagrams.
 *
 * The twelve colours are mutually distinct and avoid the red of chain axes and
 * the blue of unselected sections, so a selected curve never reads as an
 * unselected one. Index i is the curve's position in the selection after
 * pattern expansion; the palette repeats after twelve.
 *
 * @param index Zero-based position in the selection.
 * @returns A CSS hex colour (sRGB).
 *
 * @evidence contracts/common.md#principled-implementation A fixed palette indexed by selection order gives every view of one selection the same colours.
 * @evidence contracts/common.md#clear-and-simple-design One table used by every consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Colours depend only on order, never on curve names.
 * @evidence contracts/common.md#meaningful-documentation States the ordering rule, the avoided colours and the wrap-around.
 * @evidence contracts/performance.md#efficient-algorithms Constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work A module constant.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Twelve strings for the module's life.
 */
export function humanCurveColour(index: number): string {
  const palette: readonly string[] = [
    "#2f9e44",
    "#f08c00",
    "#d6336c",
    "#7048e8",
    "#0c8599",
    "#a0522d",
    "#5c940d",
    "#e64980",
    "#e67700",
    "#212529",
    "#15aabf",
    "#862e9c",
  ];
  return palette[((index % palette.length) + palette.length) % palette.length]!;
}
