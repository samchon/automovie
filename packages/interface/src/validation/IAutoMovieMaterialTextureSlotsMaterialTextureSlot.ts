import type { AutoMovieTextureBinding } from "../material/AutoMovieTextureBinding";

/**
 * Represent one borrowed image binding with its material-relative path and
 * required decoding.
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
 * The enumeration caller owns wrappers and the material owns referenced binding
 * data.
 */
export interface IAutoMovieMaterialTextureSlotsMaterialTextureSlot {
  /**
   * Path under the material, such as `.normalTexture` or
   * `.overlays[1].baseColorTexture`.
   */
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
