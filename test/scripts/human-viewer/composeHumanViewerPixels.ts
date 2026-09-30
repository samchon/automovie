/**
 * Compose equally sized RGBA captures into a horizontal pair and absolute RGB
 * difference image. This is an image comparison, not a likeness score or a
 * geometry objective. Alpha is copied in the pair and made opaque in the map.
 * Caller-owned arrays remain unchanged; incompatible dimensions refuse.
 *
 * @evidence contracts/common.md#principled-implementation Per-channel absolute subtraction visualizes exact byte differences without optimizing model inputs.
 * @evidence contracts/common.md#clear-and-simple-design A pure pixel operation has no filesystem, reference-resource or GPU ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every pixel uses the same arithmetic; no subject or view special case is present.
 * @evidence contracts/common.md#meaningful-documentation Defines map semantics, alpha behavior and input ownership.
 */
export function composeHumanViewerPixels(width: number, height: number, first: Uint8Array, second: Uint8Array):
  { width: number; height: number; data: Uint8Array } {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
    first.length !== width * height * 4 || second.length !== first.length)
    throw new Error("Comparison captures must have matching positive RGBA dimensions");
  const data = new Uint8Array(width * 3 * height * 4);
  for (let y = 0; y < height; ++y) for (let x = 0; x < width; ++x) {
    const from = (y * width + x) * 4;
    for (let channel = 0; channel < 4; ++channel) {
      const left = (y * width * 3 + x) * 4 + channel;
      data[left] = first[from + channel];
      data[left + width * 4] = second[from + channel];
      data[left + width * 8] = channel === 3 ? 255 : Math.abs(first[from + channel] - second[from + channel]);
    }
  }
  return { width: width * 3, height, data };
}
