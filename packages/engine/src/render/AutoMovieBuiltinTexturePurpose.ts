/** Actual implicit material and rectangular-light texture consumer roles.
 *
 * @evidence contracts/common.md#principled-implementation The closed roles name implicit textures actually required by subsurface, normal overlay and rectangular-area-light consumers; requiredAutoMovieMaterialTexturePurposes derives the material roles and residency reports observed runtime roles.
 * @evidence contracts/common.md#clear-and-simple-design A shared discriminant joins host runtime textures with engine closure requirements without repeating renderer-specific byte estimates in author data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The four roles represent supported consumers, not placeholder feature cases; actual allocation facts remain supplied by the capture host.
 * @evidence contracts/common.md#meaningful-documentation The union names lookup purposes, while texture extent/format and live resident ownership are documented on their corresponding records.
 * @evidence contracts/performance.md#efficient-algorithms A role is one scalar; closure matching cost belongs to the texture inventory that reads runtime rows and material requirements.
 * @evidence contracts/performance.md#reuse-equivalent-work The same role spelling is reused by actual producers and closure consumers; the type owns no cached allocation result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No texture object or native allocation is retained by this type; host context disposal remains the resource owner.
 */
export type AutoMovieBuiltinTexturePurpose =
  | "subsurface-lut"
  | "overlay-flat-normal"
  | "area-ltc-1"
  | "area-ltc-2";
