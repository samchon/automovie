import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";
/**
 * Prepared scalar outlines for one split's [u, v, tangent angle, following shoulder].
 *
 * The first two values are chart millimetres and use the section's pole-coordinate closure. Angle is radians from +u toward +v in increasing phase. Shoulder is the dimensionless share for the piece starting at this split, admitted by the downstream conic reader. This order is heterogeneous in meaning even though all four slots are scalar outline preparations.
 *
 * @evidence contracts/development/design.md#principled-representation Two position coordinates, an oriented tangent and the following piece's shoulder define the authored conic contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four original prepared outlines carry the contact through station reads without an additional sampled point table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Split ownership is not inferred from quarter extent outlines or converted into a generic four-quarter tuple.
 * @evidence contracts/development/common.md#meaningful-documentation Defines all tuple positions, heterogeneous units, angular direction and pole handling.
 */
export type AutoMovieLoftViewSourceSplit = readonly [
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
  IAutoMovieViewOutline.IOutline,
];
