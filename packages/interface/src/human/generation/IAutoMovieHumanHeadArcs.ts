/**
 * Six named head measurement courses, each expressed as a millimetre arc length.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadArcs in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Six named head measurement courses, each expressed as a millimetre arc length. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IArcs declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IArcs separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadArcs exchanges the named IArcs contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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
