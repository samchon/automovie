/**
 * Preserve a native operation's context and numeric error code in one ordinary Error; this formatter owns no handle.
 *
 * @evidence contracts/development/implementation.md#principled-implementation An ordinary Error preserves the native operation label and numeric error code for the publication cause chain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Both native adapters share one message representation rather than different error-code string formats.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The native code is reported as observed and is not reclassified as a successful or clean publication.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states message context, numeric native code and lack of handle ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms One message interpolation and Error allocation cost the label length plus runtime-dependent stack capture.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every failed native call receives its own error; effectful calls and their failures are never shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The receiver owns the returned error and its lifetime; this formatter opens no native resource.
 */
export const nativeError: (message: string, code: number) => Error = (
  message: string,
  code: number,
): Error => new Error(`${message} (native code ${code})`);
