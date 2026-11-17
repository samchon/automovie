import type { AutoMovieTextureBinding } from "../material/AutoMovieTextureBinding";

/**
 * Represent one borrowed image binding with its material-relative path and required decoding.
 *
 * One row joins slot enumeration to binding/asset/scale consumers.
 *
 * The row is metadata, not a loaded or admitted texture.
 *
 * Path suffix, borrowed binding and srgb/linear meanings are documented.
 *
 * Each row has fixed fields; binding/string population drives retained bytes.
 *
 * All material texture consumers reuse this common row representation.
 *
 * The enumeration caller owns wrappers and the material owns referenced binding data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Represent one borrowed image binding with its material-relative path and required decoding. Member documentation states the supplied records, units and absence meanings used by autoMovieRenderTextureDigest, materialTextureSlots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The row is slot metadata rather than a loaded or validated image; legacy bare-id bindings use the slot's declared decoding requirement.
 * @evidence contracts/development/design.md#principled-representation path is relative to the owning material, binding borrows its canonical image binding, and colorSpace is restricted to srgb or linear decoding.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMaterialTextureSlotsMaterialTextureSlot, used by autoMovieRenderTextureDigest, materialTextureSlots. Its path, binding, colorSpace members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export interface IAutoMovieMaterialTextureSlotsMaterialTextureSlot {
  /** Path under the material, such as `.normalTexture` or `.overlays[1].baseColorTexture`. */
  path: string;

  /** The binding as the material states it. */
  binding: AutoMovieTextureBinding;

  /**
   * The decoding the slot requires. A legacy bare-id binding declares no
   * intent, so the slot's own requirement is what it means: base colour and
   * emissive are radiometric colours stored in sRGB, and the data maps are
   * measurements that must not be gamma decoded.
   */
  colorSpace: "srgb" | "linear";
}
