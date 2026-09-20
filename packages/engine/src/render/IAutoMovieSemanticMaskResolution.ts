import { IAutoMovieSemanticMaskEntry } from "@automovie/interface";

/**
 * A mask entry with the complete ownership chain above it.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Returns both the pixel-owning identity and the semantic containers that make it editable.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Defines the resolved structural-pass answer for one sampled mask colour.
 */
export interface IAutoMovieSemanticMaskResolution {
  /**
   * The entry that owns the colour.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Identifies the exact drawable assigned to the sampled colour.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Preserves the leaf identity emitted by the structural pass.
   */
  entry: IAutoMovieSemanticMaskEntry;
  /**
   * Owners from the tightest container outward; empty for a root entry.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Connects a mask pixel to the opening, boundary, space, and building identities above its drawable.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Retains the semantic hierarchy needed to interpret and edit a structural-pass observation.
   */
  ancestors: IAutoMovieSemanticMaskEntry[];
}
