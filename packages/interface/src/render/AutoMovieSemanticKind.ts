/**
 * The closed family of things a semantic mask can address.
 *
 * `label` on an entry carries the open architectural word (`storey`, `room`,
 * `door`, `window`), so this stays a small computational classification while
 * the vocabulary of a building stays free.
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
