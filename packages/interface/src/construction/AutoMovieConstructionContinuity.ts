/**
 * The continuity a join's blend keeps across both its rails: `G2`, the position, the tangent plane and the normal curvature of each surface.
 *
 * The blend is the quintic Hermite in its cross parameter between the two surfaces' 2-jets along their rails, so G2 holds exactly at the blend's columns and to its interpolation between them.
 *
 * @evidence contracts/common.md#principled-implementation A quintic Hermite whose edge jets are the surfaces' own 2-jets meets each surface G2 by construction.
 * @evidence contracts/common.md#clear-and-simple-design One value names the one continuity the operator builds; a lower continuity would be a new value, not a flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not promise G2 between columns beyond the stated interpolation.
 * @evidence contracts/common.md#meaningful-documentation States what G2 holds, why the blend has it and where it is exact.
 */
export type AutoMovieConstructionContinuity = "G2";
