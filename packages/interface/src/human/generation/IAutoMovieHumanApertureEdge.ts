/** Open edge of the cut skin, directed as its triangle winds it.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Open edge of the cut skin, directed as its triangle winds it.
 * @evidence contracts/development/design.md#principled-representation `u`: Start vertex. `v`: End vertex. `inside`: Third vertex of the retained skin triangle owning this edge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanApertureConstruction.generate. Also types AutoMovieHumanAperturePocket.open, AutoMovieHumanEyelidSurface.open.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `u`, `v`, `inside`, `name`; callers supply the complete record.
 */
export interface IAutoMovieHumanApertureEdge {
  /** Start vertex. */
  u: number;

  /** End vertex. */
  v: number;

  /** Third vertex of the retained skin triangle owning this edge. */
  inside: number;

  /** Group of the triangle the edge bounds. */
  name: string;
}
