/**
 * Relative luminance of already linear sRGB using the W3C RGB weights.
 * See https://www.w3.org/TR/WCAG22/#dfn-relative-luminance.
 *
 * @evidence contracts/common.md#principled-implementation Takes the three-channel weighted sum with 0.2126, 0.7152 and 0.0722 as specified for linearized sRGB relative luminance. Inputs must already be linear and contain three finite representable channels; this helper neither decodes sRGB nor validates array length.
 * @evidence contracts/common.md#clear-and-simple-design One named scalar conversion is shared by card balancing and keeps channel weights outside native-light allocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Standard linear RGB weights are used uniformly, without fixture color corrections or averaging channels to force neutrality.
 * @evidence contracts/common.md#meaningful-documentation The comment states the already-linear color space and links the read primary definition; the supported three-channel premise is explicit.
 * @evidence contracts/performance.md#efficient-algorithms Three multiplications and two additions require constant work and no arrays; very large custom channel values can overflow ordinary floating arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers reuse this canonical channel conversion; the function retains no color-keyed cache and recomputes mutable values on each call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the input array and returns a scalar with no retained record, native handle or task.
 */
export const humanPreviewLuminance: (rgb: readonly number[]) => number = (
  rgb: readonly number[],
): number => 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
