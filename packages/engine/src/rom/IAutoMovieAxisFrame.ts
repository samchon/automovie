/**
 * One degree-valued affine clinical mapping: clinical = sign * rig + neutral. Conversion owners admit sign plus/minus one and finite neutral; the type itself performs no validation.
 *
 * @evidence contracts/common.md#principled-implementation Represent clinical=sign*rig+neutral in degrees, with sign plus/minus one and finite neutral admitted by scalar/interval conversion owners.
 * @evidence contracts/common.md#clear-and-simple-design A per-axis affine record separates rest orientation from clinical convention without changing units.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typing alone enforces no runtime finiteness; omitted frames mean identity and null angles preserve rest in converters.
 * @evidence contracts/common.md#meaningful-documentation Members state mirrored sign and clinical rest angle in degrees with conversion admission identified.
 * @evidence contracts/performance.md#efficient-algorithms Two scalars require fixed storage and conversion uses constant arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Forward, inverse and interval owners share the frame meaning; changed sign/neutral requires new results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The rig/caller owns frame records and this type retains no pose history, handle or task.
 * @author Samchon
 */
export interface IAutoMovieAxisFrame {
  /** Axis direction relative to the clinical convention. */
  sign: 1 | -1;

  /** Clinical angle in degrees represented by the rig's rest orientation. */
  neutral: number;
}
