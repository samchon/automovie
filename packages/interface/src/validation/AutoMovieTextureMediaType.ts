/**
 * Name the image-container media types admitted by texture and environment validation.
 *
 * @evidence contracts/development/design.md#principled-representation The closed union covers PNG, JPEG, WebP and Radiance HDR; material texture admission uses the first three and environment admission may use all four.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A shared media-type vocabulary joins image facts and asset validation without encoding decoder behavior in a type alias.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A media label alone does not certify bytes, dimensions, adopted content or successful decoding; those facts belong to the consuming gates and viewer.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the four admitted labels and the material/environment distinction rather than implying universal codec support from the union.
 */
export type AutoMovieTextureMediaType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/vnd.radiance";
