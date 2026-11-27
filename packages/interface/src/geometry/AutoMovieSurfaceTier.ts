/**
 * A named resolution of a surface network's control cage.
 *
 * `lowest` is a stick or block level with the fewest faces that still close
 * every patch; `low`, `medium` and `high` add rows and columns. Each tier has
 * one fixed topology for every shape the network takes, and all tiers address
 * the same surface coordinates, so a point, a texture or a garment placed on
 * one tier maps onto every other.
 */
export type AutoMovieSurfaceTier = "lowest" | "low" | "medium" | "high";
