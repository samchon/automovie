import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieSemanticMaskEntry } from "./IAutoMovieSemanticMaskEntry";
import { IAutoMovieSemanticMaskGap } from "./IAutoMovieSemanticMaskGap";

/**
 * A segmentation palette keyed by stable semantic identity, plus the sidecar
 * that reads a rendered color back to the thing it named.
 *
 * The mask pass this replaces coloured the Nth top-level scene child with the
 * Nth colour of a golden-angle ramp. Two things were wrong with that, and both
 * are why a mask could not be used as evidence. A whole building collapsed into
 * one colour, so a room, a wall, an opening and a repeated window slot were
 * indistinguishable in the very image that exists to distinguish them. And the
 * colour was an ARRAY INDEX, so inserting an unrelated node ahead of a building
 * repainted the building: two masks of the same design disagreed about what
 * they had segmented, and neither was wrong.
 *
 * Here a colour is a pure function of the entity's stable semantic id. Scene
 * order, insertion order, and the presence of unrelated entities do not enter
 * the derivation, so reordering the scene reproduces a byte-identical mask and
 * adding an unrelated node leaves every existing colour untouched. Two ids that
 * hash to the same colour are separated deterministically by comparing the ids
 * themselves rather than by their position, so the tie-break is a property of
 * the pair and not of the scene around them.
 *
 * The palette is exact 8-bit-per-channel RGB, so a PNG readback recovers the
 * authored value with no tolerance, and `#000000` is reserved for background
 * and never assigned.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieSemanticMask` as the portable data boundary for the rendering identity mask channels requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieSemanticMask` for the spec render pass products system contract.
 * @author Samchon
 */
export interface IAutoMovieSemanticMask {
  /**
   * Mask format.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `version` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `version` for the spec render pass products system contract.
   */
  version: 2;

  /**
   * Versioned palette-derivation protocol.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `protocol` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `protocol` for the spec render pass products system contract.
   */
  protocol: "automovie.semantic-mask.v2";

  /**
   * Reserved background colour, never assigned to an entry.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `background` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `background` for the spec render pass products system contract.
   */
  background: "#000000";

  /**
   * Entries in ascending semantic-id order.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `entries` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `entries` for the spec render pass products system contract.
   */
  entries: IAutoMovieSemanticMaskEntry[];

  /**
   * Instance sets whose per-slot colours were not allocated, and why.
   *
   * A mask is bounded evidence: it cannot carry one entry per slot for an
   * arbitrarily large instanced set. A set listed here is still addressable as
   * a whole through its `instance-set` entry; only per-slot identity is absent,
   * and it is reported rather than quietly approximated.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `unaddressed` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `unaddressed` for the spec render pass products system contract.
   */
  unaddressed: IAutoMovieSemanticMaskGap[];

  /**
   * Digest over the complete canonical versioned payload except this field.
   * It therefore seals background, every entry field, and every bounded gap.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `digest` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `digest` for the spec render pass products system contract.
   */
  digest: AutoMovieContentDigest;
}
