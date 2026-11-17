/** Actual implicit material and rectangular-light texture consumer roles.
 *
 * @evidence contracts/development/design.md#principled-representation The closed roles name implicit textures actually required by subsurface, normal overlay and rectangular-area-light consumers; requiredAutoMovieMaterialTexturePurposes derives the material roles and residency reports observed runtime roles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A shared discriminant joins host runtime textures with engine closure requirements without repeating renderer-specific byte estimates in author data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The four roles represent supported consumers, not placeholder feature cases; actual allocation facts remain supplied by the capture host.
 * @evidence contracts/development/common.md#meaningful-documentation The union names lookup purposes, while texture extent/format and live resident ownership are documented on their corresponding records.
 */
export type AutoMovieBuiltinTexturePurpose =
  | "subsurface-lut"
  | "overlay-flat-normal"
  | "area-ltc-1"
  | "area-ltc-2";
