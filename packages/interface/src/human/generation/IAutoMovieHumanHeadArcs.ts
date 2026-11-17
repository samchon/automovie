/** Type contracts exchanged by AutoMovieHumanHeadArcs; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadArcs {
  /** The six arcs, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The six arcs, mm.
   * @evidence contracts/development/design.md#principled-representation `coronal`: Over the vertex in the coronal plane. `crinion`: Over the crinion, the hairline's midpoint. `minimumFrontal`: Over the forehead at the minimum frontal breadth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadArcs.of. Also types AutoMovieHumanHeadArcs.ARCS, AutoMovieHumanHeadArcs.ON_CIRCUMFERENCE.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `coronal`, `crinion`, `minimumFrontal`, `subnasale`, `menton`, `submandibular`; callers supply the complete record.
   */
  export interface IArcs {
    /** Over the vertex in the coronal plane. */
    coronal: number;

    /** Over the crinion, the hairline's midpoint. */
    crinion: number;

    /** Over the forehead at the minimum frontal breadth. */
    minimumFrontal: number;

    /** Under the nose, over the subnasale. */
    subnasale: number;

    /** Over the chin's menton. */
    menton: number;

    /** Under the mandible. */
    submandibular: number;
  }
}
