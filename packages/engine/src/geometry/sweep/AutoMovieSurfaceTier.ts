/**
 * A named resolution of a surface network's control cage.
 *
 * `lowest` is a stick or block level with the fewest faces that still close
 * every patch; `low`, `medium` and `high` add rows and columns. Each tier has
 * one fixed topology for every shape the network takes, and all tiers address
 * the same surface coordinates, so a point, a texture or a garment placed on
 * one tier maps onto every other.
 *
 * @evidence contracts/common.md#principled-implementation A closed set of level-of-detail names, each a fixed sampling of one surface definition rather than a separately authored mesh.
 * @evidence contracts/common.md#clear-and-simple-design Four names cover stick, low, medium and high detail; counts per tier live on the patches that own them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tier is derived by decimating another; each samples the definition itself.
 * @evidence contracts/common.md#meaningful-documentation States what each tier is for and what stays fixed across shapes and tiers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type.
 */
export type AutoMovieSurfaceTier = "lowest" | "low" | "medium" | "high";
