# src/index.ts#filterRecoveryImageGaussian

## @evidence contracts/development/implementation.md#principled-implementation

Separable Gaussian convolution and its first derivative provide the Harris scale-space premise; derivative correlation weights have the sign of their source offset, so an increasing horizontal ramp has positive image-x derivative. Half-sample reflection defines every boundary sample without inventing a crop or foreground mask.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admitted chart filter owns kernel normalization, derivative weights and both axis passes; detection and descriptor owners choose the needed derivative rather than duplicating boundary rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source image, object region or expected feature changes the kernel. Sampling is explicit convolution without foreign replacement, learned weights or manual pixel selection.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative sign, four-sigma truncation, boundary extension, dimensions, ownership and the admitted-input premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P pixels and radius r=round(4*sigma), two separable passes cost O(P*r) and O(P+r) auxiliary storage, rather than a two-dimensional O(P*r^2) kernel. The capture owner bounds P and pyramid scales before calling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One normalized Gaussian kernel supplies both axis weight sets; each pass reuses its weight array across the chart. Image bytes vary between levels and calls, so no cross-call cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrowed finite source pixels stay unchanged; two owned P-length arrays and O(r) weights are local, with only the final array transferred. No resource handle, timer or persistent cache is acquired.
