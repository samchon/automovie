/**
 * The closed family of things a semantic mask can address.
 *
 * Entry labels retain open architectural vocabulary while this union supplies the computational family used for addressing and mask lookup.
 *
 * @evidence contracts/common.md#principled-implementation Closed kinds distinguish semantic hierarchy, scene nodes, compact populations and simulated drawables that the engine palette collector and viewer resolution actually address.
 * @evidence contracts/common.md#clear-and-simple-design Computational kind stays separate from an open domain label, so adding an architectural term does not require a new palette dispatch case.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A logical building or space need not paint pixels itself; drawable entries map to their node or slot identities and hierarchy ownership preserves their semantic context.
 * @evidence contracts/common.md#meaningful-documentation Defines the addressed entity family and its separation from open architectural labels.
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
