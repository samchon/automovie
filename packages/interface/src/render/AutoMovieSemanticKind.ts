/**
 * The closed family of things a semantic mask can address.
 *
 * Entry labels retain open architectural vocabulary while this union supplies
 * the computational family used for addressing and mask lookup.
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
  | "planting"
  | "surface-graphic"
  | "flame";
