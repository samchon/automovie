import { AutoMovieSemanticKind } from "./AutoMovieSemanticKind";
import { IAutoMovieSemanticMaskSlot } from "./IAutoMovieSemanticMaskSlot";

/**
 * One addressable entity and the flat colour the mask pass paints it.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieSemanticMaskEntry` as the portable data boundary for the rendering identity mask channels requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieSemanticMaskEntry` for the spec render pass products system contract.
 */
export interface IAutoMovieSemanticMaskEntry {
  /**
   * Stable semantic id, of the form `<kind>:<path>`.
   *
   * Examples: `building:tower/unit-a`, `space:tower/level-2`,
   * `opening:tower/door-12`, `node:hero-actor`, `instance-slot:windows#417`.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `id` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `id` for the spec render pass products system contract.
   */
  id: string;

  /**
   * Computational classification.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `kind` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `kind` for the spec render pass products system contract.
   */
  kind: AutoMovieSemanticKind;

  /**
   * The open architectural word the design used (`storey`, `room`, `door`), or
   * `null` for a kind that carries none.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `label` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `label` for the spec render pass products system contract.
   */
  label: string | null;

  /**
   * Exact opaque `#RRGGBB` colour, uppercase hexadecimal.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `color` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `color` for the spec render pass products system contract.
   */
  color: string;

  /**
   * Semantic id of the owning entity, or `null` for a root.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `owner` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `owner` for the spec render pass products system contract.
   */
  owner: string | null;

  /**
   * Scene node ids that draw this entity, ascending.
   *
   * This is the join between the semantic graph and the built scene: the viewer
   * resolves a mesh to its top-level node and finds its colour here, so the
   * mask pass needs no knowledge of architecture.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `nodes` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `nodes` for the spec render pass products system contract.
   */
  nodes: string[];

  /**
   * Owning instance set and zero-based slot, or `null` for every other kind.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `slot` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `slot` for the spec render pass products system contract.
   */
  slot: IAutoMovieSemanticMaskSlot | null;
}
