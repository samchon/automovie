/**
 * The closed family of things a semantic mask can address.
 *
 * `label` on an entry carries the open architectural word (`storey`, `room`,
 * `door`, `window`), so this stays a small computational classification while
 * the vocabulary of a building stays free.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `AutoMovieSemanticKind` as the portable data boundary for the rendering identity mask channels requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `AutoMovieSemanticKind` for the spec render pass products system contract.
 */
export type AutoMovieSemanticKind =
  | "building"
  | "space"
  | "boundary"
  | "opening"
  | "element"
  | "node"
  | "instance-set"
  | "instance-slot"
  | "water-body"
  | "soft-body"
  | "planting";
