/**
 * Compose equally sized RGBA captures into a horizontal pair and absolute RGB difference image. This is an image comparison, not a likeness score or a geometry objective. Alpha is copied in the pair and made opaque in the map. Caller-owned arrays remain unchanged; incompatible dimensions refuse.
 *
 * @evidence contracts/common.md#principled-implementation Equal positive RGBA dimensions admit two byte captures; output places original images side by side and computes absolute per-channel RGB differences with opaque comparison alpha.
 * @evidence contracts/common.md#clear-and-simple-design One output buffer and nested pixel/channel loops own the three-panel composition without invoking numerical geometry or likeness metrics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Difference bytes come directly from supplied captures and no expected subject image, registration adjustment or hidden tolerance changes the comparison.
 * @evidence contracts/common.md#meaningful-documentation The comment defines horizontal pair/difference layout, alpha handling, input preservation and refusal of incompatible dimensions.
 * @evidence contracts/performance.md#efficient-algorithms W by H inputs require O(W*H) byte work and one 12*W*H-byte output; each input channel is read directly without intermediate image copies.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Array identities can retain mutable pixel contents, so the function owns no cross-call image-comparison cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain caller-owned and the returned Uint8Array transfers output ownership to the caller; no image decoder, canvas or GPU handle is retained.
 */
export function composeHumanViewerPixels(
  width: number,
  height: number,
  first: Uint8Array,
  second: Uint8Array,
): { width: number; height: number; data: Uint8Array } {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    first.length !== width * height * 4 ||
    second.length !== first.length
  )
    throw new Error(
      "Comparison captures must have matching positive RGBA dimensions",
    );
  const data: Uint8Array = new Uint8Array(width * 3 * height * 4);
  for (let y: number = 0; y < height; ++y)
    for (let x: number = 0; x < width; ++x) {
      const from: number = (y * width + x) * 4;
      for (let channel: number = 0; channel < 4; ++channel) {
        const left: number = (y * width * 3 + x) * 4 + channel;
        data[left] = first[from + channel];
        data[left + width * 4] = second[from + channel];
        data[left + width * 8] =
          channel === 3
            ? 255
            : Math.abs(first[from + channel] - second[from + channel]);
      }
    }
  return { width: width * 3, height, data };
}
