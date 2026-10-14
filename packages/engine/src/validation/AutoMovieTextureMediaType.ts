/**
 * Name the image-container media types admitted by texture and environment validation.
 *
 * @evidence contracts/common.md#principled-implementation The closed union covers PNG, JPEG, WebP and Radiance HDR; material texture admission uses the first three and environment admission may use all four.
 * @evidence contracts/common.md#clear-and-simple-design A shared media-type vocabulary joins image facts and asset validation without encoding decoder behavior in a type alias.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A media label alone does not certify bytes, dimensions, adopted content or successful decoding; those facts belong to the consuming gates and viewer.
 * @evidence contracts/common.md#meaningful-documentation Documents the four admitted labels and the material/environment distinction rather than implying universal codec support from the union.
 * @evidence contracts/performance.md#efficient-algorithms The erased union costs no runtime work; image probing and decoding costs belong to their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share the same closed label set, while runtime accepted subsets remain explicit in material/environment gates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A label owns no image bytes, decoded pixels, texture or decoder lifetime.
 * @author Samchon
 */
export type AutoMovieTextureMediaType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/vnd.radiance";
