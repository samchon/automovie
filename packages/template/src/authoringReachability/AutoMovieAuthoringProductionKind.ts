/**
 * Production shapes whose authoring routes are published by the scaffold.
 *
 * @evidence requirements/product/authorability.md#product-discoverable-control Keeps the shape selector inside the same public route inventory the author queries.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-choice-discovery Types the closed shape dimension of every capability row.
 */
export type AutoMovieAuthoringProductionKind = "film" | "brief" | "library";
