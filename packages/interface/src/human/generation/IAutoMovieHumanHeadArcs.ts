/**
 * Six named head measurement courses, each expressed as a millimetre arc
 * length.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadArcs in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadArcs {
  /** The six arcs, mm. */
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
