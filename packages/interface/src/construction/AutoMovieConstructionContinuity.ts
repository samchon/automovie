/**
 * The continuity a join's blend keeps across both its rails: `G2`, the position, the tangent plane and the normal curvature of each surface.
 *
 * The blend is the quintic Hermite in its cross parameter between the two surfaces' 2-jets along their rails, so G2 holds exactly at the blend's columns and to its interpolation between them.
 *
 * @evidence contracts/development/design.md#principled-representation A quintic Hermite whose edge jets are the surfaces' own 2-jets meets each surface G2 by construction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One value names the one continuity the operator builds; a lower continuity would be a new value, not a flag.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not promise G2 between columns beyond the stated interpolation.
 * @evidence contracts/development/common.md#meaningful-documentation States what G2 holds, why the blend has it and where it is exact.
 */
export type AutoMovieConstructionContinuity = "G2";
