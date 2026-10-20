/**
 * Filter one finite grayscale chart with separable sampled Gaussian kernels.
 * First derivatives use the derivative of the Gaussian, not a finite difference
 * of an unrelated blur. Four-sigma truncation and half-sample reflection follow
 * scipy.ndimage's documented Gaussian-filter chart used by the experiment.
 * https://docs.scipy.org/doc/scipy/reference/generated/scipy.ndimage.gaussian_filter.html
 *
 * @evidence contracts/common.md#principled-implementation Separable Gaussian convolution and its first derivative provide the Harris scale-space premise; derivative correlation weights have the sign of their source offset, so an increasing horizontal ramp has positive image-x derivative. Half-sample reflection defines every boundary sample without inventing a crop or foreground mask.
 * @evidence contracts/common.md#clear-and-simple-design One admitted chart filter owns kernel normalization, derivative weights and both axis passes; detection and descriptor owners choose the needed derivative rather than duplicating boundary rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source image, object region or expected feature changes the kernel. Sampling is explicit convolution without foreign replacement, learned weights or manual pixel selection.
 * @evidence contracts/common.md#meaningful-documentation States derivative sign, four-sigma truncation, boundary extension, dimensions, ownership and the admitted-input premise.
 * @evidence contracts/performance.md#efficient-algorithms For P pixels and radius r=round(4*sigma), two separable passes cost O(P*r) and O(P+r) auxiliary storage, rather than a two-dimensional O(P*r^2) kernel. The capture owner bounds P and pyramid scales before calling.
 * @evidence contracts/performance.md#reuse-equivalent-work One normalized Gaussian kernel supplies both axis weight sets; each pass reuses its weight array across the chart. Image bytes vary between levels and calls, so no cross-call cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed finite source pixels stay unchanged; two owned P-length arrays and O(r) weights are local, with only the final array transferred. No resource handle, timer or persistent cache is acquired.
 */
export function filterRecoveryImageGaussian(
  source: Float64Array,
  width: number,
  height: number,
  sigma: number,
  derivative: "none" | "x" | "y" = "none",
): Float64Array {
  const radius: number = Math.round(4 * sigma);
  const gaussian: Float64Array = new Float64Array(2 * radius + 1);
  let total: number = 0;
  for (let offset: number = -radius; offset <= radius; offset++) {
    const value: number = Math.exp(-0.5 * (offset / sigma) ** 2);
    gaussian[offset + radius] = value;
    total += value;
  }
  for (let at: number = 0; at < gaussian.length; at++) gaussian[at] /= total;
  const differentiated: Float64Array =
    derivative === "none"
      ? gaussian
      : gaussian.map(
          (weight: number, at: number): number =>
            weight * ((at - radius) / (sigma * sigma)),
        );
  const verticalWeights: Float64Array =
    derivative === "y" ? differentiated : gaussian;
  const horizontalWeights: Float64Array =
    derivative === "x" ? differentiated : gaussian;
  const reflected: (at: number, length: number) => number = (
    at: number,
    length: number,
  ): number => {
    const period: number = 2 * length;
    const wrapped: number = ((at % period) + period) % period;
    return wrapped < length ? wrapped : period - wrapped - 1;
  };
  // Apply vertical then horizontal, matching the numerical observation chart.
  const intermediate: Float64Array = new Float64Array(source.length);
  const result: Float64Array = new Float64Array(source.length);
  for (let y: number = 0; y < height; y++) {
    for (let x: number = 0; x < width; x++) {
      let value: number = 0;
      for (let offset: number = -radius; offset <= radius; offset++) {
        value +=
          source[reflected(y + offset, height) * width + x]! *
          verticalWeights[offset + radius]!;
      }
      intermediate[y * width + x] = value;
    }
  }
  for (let y: number = 0; y < height; y++) {
    for (let x: number = 0; x < width; x++) {
      let value: number = 0;
      for (let offset: number = -radius; offset <= radius; offset++) {
        value +=
          intermediate[y * width + reflected(x + offset, width)]! *
          horizontalWeights[offset + radius]!;
      }
      result[y * width + x] = value;
    }
  }
  return result;
}
